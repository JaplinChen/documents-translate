"""Translation chunk processing utilities.

This module contains chunk-level translation logic including
preparation, execution, and retry handling.
"""
from __future__ import annotations

import logging
import random
import time
from urllib.error import HTTPError

from backend.services.language_detect import detect_language
from backend.services.llm_clients import MockTranslator
from backend.services.llm_contract import build_contract, coerce_contract, validate_contract
from backend.services.llm_placeholders import apply_placeholders
from backend.services.translate_config import (
    get_language_hint,
    get_tone_instruction,
    get_vision_context_instruction,
)
from backend.services.translate_prompt import (
    build_ollama_batch_prompt,
    parse_ollama_batch_response,
)
from backend.services.translate_retry import (
    build_language_retry_context,
    has_language_mismatch,
)

LOGGER = logging.getLogger(__name__)


def prepare_chunk(
    chunk: list[tuple[int, dict]],
    use_placeholders: bool,
    preferred_terms: list[tuple[str, str]],
) -> tuple[list[dict], list[dict], list[str]]:
    """Prepare a chunk of blocks for translation.
    
    Args:
        chunk: List of (index, block) tuples
        use_placeholders: Whether to use placeholder substitution
        preferred_terms: List of (source, target) term pairs
        
    Returns:
        Tuple of (chunk_blocks, placeholder_maps, placeholder_tokens)
    """
    chunk_blocks = []
    placeholder_maps: list[dict[str, str]] = []
    placeholder_tokens: list[str] = []
    
    for _, block in chunk:
        prepared = dict(block)
        if use_placeholders:
            prepared_text, mapping = apply_placeholders(
                prepared.get("source_text", ""), preferred_terms
            )
        else:
            prepared_text = prepared.get("source_text", "")
            mapping = {}
        prepared["source_text"] = prepared_text
        if mapping:
            placeholder_tokens.extend(mapping.keys())
        placeholder_maps.append(mapping)
        chunk_blocks.append(prepared)
    
    return chunk_blocks, placeholder_maps, placeholder_tokens


def translate_chunk(
    translator,
    provider: str,
    chunk_blocks: list[dict],
    target_language: str,
    context: dict | None,
    preferred_terms: list,
    placeholder_tokens: list,
    tone: str | None,
    vision_context: bool,
    params: dict,
    chunk_index: int,
    fallback_on_error: bool,
    mode: str,
) -> dict:
    """Translate a single chunk with retry logic.
    
    Args:
        translator: Translator instance
        provider: Provider name
        chunk_blocks: Blocks to translate
        target_language: Target language code
        context: Context information
        preferred_terms: Preferred term pairs
        placeholder_tokens: Placeholder tokens in use
        tone: Translation tone
        vision_context: Whether to use vision context
        params: Translation parameters
        chunk_index: Index of current chunk
        fallback_on_error: Whether to fallback on error
        mode: Translation mode
        
    Returns:
        Translation result dictionary
    """
    attempt = 0
    retried_for_language = False
    
    while True:
        try:
            attempt += 1
            LOGGER.info(
                "LLM chunk %s attempt %s size=%s",
                chunk_index, attempt, len(chunk_blocks),
            )
            
            if provider == "ollama":
                result = _translate_ollama(
                    translator, chunk_blocks, target_language, context,
                    preferred_terms, placeholder_tokens, tone, vision_context,
                )
            else:
                result = _translate_standard(
                    translator, chunk_blocks, target_language, context,
                    preferred_terms, placeholder_tokens, tone, vision_context,
                )
            
            chunk_texts = [item.get("translated_text", "") for item in result["blocks"]]
            if not retried_for_language and has_language_mismatch(chunk_texts, target_language):
                retried_for_language = True
                LOGGER.warning("LLM chunk %s language mismatch; retrying", chunk_index)
                result = _retry_for_language(
                    translator, provider, chunk_blocks, target_language,
                    context, preferred_terms, placeholder_tokens,
                    chunk_texts, chunk_index,
                )
            
            return result
            
        except Exception as exc:
            if _is_vision_error(str(exc)):
                raise ValueError(
                    "偵測到圖片相關錯誤。您的 PPTX 可能包含圖片，"
                    "但目前所選模型不支援圖片輸入。"
                    "請在 LLM 設定中選擇支援視覺模型（例如 GPT-4o）。"
                ) from exc
            
            LOGGER.warning(
                "LLM chunk %s attempt %s failed: %s",
                chunk_index, attempt, exc,
            )
            
            if attempt > params["max_retries"]:
                if fallback_on_error and mode != "mock":
                    return _fallback_mock(
                        chunk_blocks, target_language, context,
                        preferred_terms, placeholder_tokens,
                    )
                raise
            
            sleep_for = _calculate_backoff(
                exc, attempt, params["backoff"], params["max_backoff"]
            )
            time.sleep(sleep_for)


def _translate_ollama(
    translator, chunk_blocks, target_language, context,
    preferred_terms, placeholder_tokens, tone, vision_context,
):
    """Handle Ollama-specific translation."""
    prompt = build_ollama_batch_prompt(chunk_blocks, target_language)
    text_output = translator.translate_plain(prompt)
    translated_texts_chunk = parse_ollama_batch_response(text_output, len(chunk_blocks))
    
    if translated_texts_chunk is None:
        LOGGER.warning("Ollama response format mismatch, fallback to JSON mode")
        custom_hint = _build_custom_hint(target_language, tone, vision_context)
        result = translator.translate(
            chunk_blocks, target_language,
            context=context,
            preferred_terms=preferred_terms,
            placeholder_tokens=placeholder_tokens,
            language_hint=custom_hint,
        )
        result = coerce_contract(result, chunk_blocks, target_language)
    else:
        result = build_contract(chunk_blocks, target_language, translated_texts_chunk)
    
    validate_contract(result)
    return result


def _translate_standard(
    translator, chunk_blocks, target_language, context,
    preferred_terms, placeholder_tokens, tone, vision_context,
):
    """Handle standard (OpenAI/Gemini) translation."""
    custom_hint = _build_custom_hint(target_language, tone, vision_context)
    result = translator.translate(
        chunk_blocks, target_language,
        context=context,
        preferred_terms=preferred_terms,
        placeholder_tokens=placeholder_tokens,
        language_hint=custom_hint,
    )
    result = coerce_contract(result, chunk_blocks, target_language)
    validate_contract(result)
    return result


def _build_custom_hint(
    target_language: str, tone: str | None, vision_context: bool
) -> str:
    """Build custom hint string for translation."""
    hint = get_language_hint(target_language)
    tone_hint = get_tone_instruction(tone)
    vision_hint = get_vision_context_instruction(vision_context)
    return f"{hint}\n{tone_hint}\n{vision_hint}".strip()


def _retry_for_language(
    translator, provider, chunk_blocks, target_language,
    context, preferred_terms, placeholder_tokens, chunk_texts, chunk_index,
):
    """Retry translation due to language mismatch."""
    if provider == "ollama":
        strict_prompt = build_ollama_batch_prompt(
            chunk_blocks, target_language, strict=True
        )
        strict_output = translator.translate_plain(strict_prompt)
        strict_texts = parse_ollama_batch_response(strict_output, len(chunk_blocks))
        if strict_texts is not None:
            result = build_contract(chunk_blocks, target_language, strict_texts)
            validate_contract(result)
            return result
        raise ValueError(
            f"Ollama 重試後格式不符且語言仍不正確。目標語言={target_language}。"
        )
    
    strict_context = build_language_retry_context(context, chunk_texts, target_language)
    result = translator.translate(
        chunk_blocks, target_language,
        context=strict_context,
        preferred_terms=preferred_terms,
        placeholder_tokens=placeholder_tokens,
    )
    result = coerce_contract(result, chunk_blocks, target_language)
    validate_contract(result)
    
    strict_texts = [item.get("translated_text", "") for item in result["blocks"]]
    if has_language_mismatch(strict_texts, target_language):
        detected = _detect_top_language(strict_texts)
        raise ValueError(
            f"翻譯結果不符合目標語言。"
            f"目標={target_language}，偵測={detected or 'unknown'}。"
        )
    
    return result


def _detect_top_language(texts: list[str]) -> str | None:
    """Detect the most common language in texts."""
    counts: dict[str, int] = {}
    for text in texts:
        detected = detect_language((text or "").strip())
        if detected:
            counts[detected] = counts.get(detected, 0) + 1
    if not counts:
        return None
    return sorted(counts.items(), key=lambda x: x[1], reverse=True)[0][0]


def _is_vision_error(error_msg: str) -> bool:
    """Check if error is related to vision/image."""
    lower = error_msg.lower()
    return "image" in lower or "vision" in lower


def _fallback_mock(
    chunk_blocks, target_language, context, preferred_terms, placeholder_tokens,
):
    """Fallback to mock translator."""
    result = MockTranslator().translate(
        chunk_blocks, target_language,
        context=context,
        preferred_terms=preferred_terms,
        placeholder_tokens=placeholder_tokens,
    )
    result = coerce_contract(result, chunk_blocks, target_language)
    validate_contract(result)
    return result


def _calculate_backoff(
    exc: Exception, attempt: int, backoff: float, max_backoff: float
) -> float:
    """Calculate backoff time for retry."""
    retry_after = None
    if isinstance(exc, HTTPError) and exc.code in {429, 503}:
        retry_after = exc.headers.get("Retry-After")
    if retry_after:
        try:
            return max(float(retry_after), 0)
        except ValueError:
            pass
    return min(backoff * attempt, max_backoff) + random.uniform(0, 0.5)
