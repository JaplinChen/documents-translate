"""LLM-based translation service for PPTX text blocks.

This module provides the main translation orchestration logic,
delegating to sub-modules for configuration, prompts, and retry handling.
"""
from __future__ import annotations

import logging
import os
import time

from backend.services.llm_clients import MockTranslator
from backend.services.llm_context import build_context
from backend.services.llm_contract import build_contract
from backend.services.llm_glossary import load_glossary
from backend.services.llm_placeholders import has_placeholder
from backend.services.llm_utils import cache_key, chunked, tm_respects_terms
from backend.services.translate_chunk import prepare_chunk, translate_chunk
from backend.services.translate_retry import apply_translation_results
from backend.services.translate_selector import get_translation_params, select_translator
from backend.services.translation_memory import (
    get_glossary_terms,
    get_glossary_terms_any,
    get_tm_terms,
    get_tm_terms_any,
    lookup_tm,
)

LOGGER = logging.getLogger(__name__)


def _prepare_pending_blocks(
    blocks_list: list[dict],
    target_language: str,
    source_lang: str,
    use_tm: bool,
    use_placeholders: bool,
    preferred_terms: list[tuple[str, str]],
) -> tuple[list[str | None], list[tuple[int, dict]], dict[str, str]]:
    """Prepare blocks for translation, checking cache and TM.
    
    Args:
        blocks_list: List of blocks to translate
        target_language: Target language code
        source_lang: Source language code
        use_tm: Whether to use translation memory
        use_placeholders: Whether placeholders are in use
        preferred_terms: Preferred term pairs
        
    Returns:
        Tuple of (translated_texts, pending_blocks, cache)
    """
    cache: dict[str, str] = {}
    translated_texts: list[str | None] = [None] * len(blocks_list)
    pending: list[tuple[int, dict]] = []
    
    for index, block in enumerate(blocks_list):
        key = cache_key(block)
        if not key:
            translated_texts[index] = ""
            continue
        if key in cache:
            if not use_placeholders and has_placeholder(cache[key]):
                continue
            translated_texts[index] = cache[key]
            continue
        if source_lang and source_lang != "auto" and use_tm:
            tm_hit = lookup_tm(
                source_lang=source_lang,
                target_lang=target_language,
                text=key,
            )
            if (
                tm_hit is not None
                and tm_respects_terms(key, tm_hit, preferred_terms)
                and not (not use_placeholders and has_placeholder(tm_hit))
            ):
                translated_texts[index] = tm_hit
                cache[key] = tm_hit
                continue
        pending.append((index, block))
    
    return translated_texts, pending, cache


def translate_blocks(
    blocks: list[dict] | tuple[dict, ...],
    target_language: str,
    use_tm: bool = True,
    provider: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    tone: str | None = None,
    vision_context: bool = True,
    smart_layout: bool = True,
) -> dict:
    """Translate text blocks using LLM.
    
    Args:
        blocks: List of text blocks to translate
        target_language: Target language code
        use_tm: Whether to use translation memory
        provider: LLM provider (openai, gemini, ollama)
        model: Model name
        api_key: API key for the provider
        base_url: Base URL for the API
        tone: Translation tone (professional, concise, etc.)
        vision_context: Whether to use vision context
        smart_layout: Whether to use smart layout
        
    Returns:
        Translation contract with translated blocks
    """
    mode = os.getenv("TRANSLATE_LLM_MODE", "real").lower()
    fallback_on_error = os.getenv("LLM_FALLBACK_ON_ERROR", "0").lower() in {
        "1", "true", "yes"
    }

    if mode == "mock":
        resolved_provider = "mock"
        translator = MockTranslator()
    else:
        resolved_provider, translator = select_translator(
            provider, model, api_key, base_url, fallback_on_error
        )

    blocks_list = list(blocks)
    source_lang = os.getenv("SOURCE_LANGUAGE", "auto")
    
    # Load preferred terms
    preferred_terms = _load_preferred_terms(source_lang, target_language, use_tm)
    use_placeholders = resolved_provider != "ollama"
    
    translated_texts, pending, cache = _prepare_pending_blocks(
        blocks_list, target_language, source_lang,
        use_tm, use_placeholders, preferred_terms,
    )

    params = get_translation_params(resolved_provider)
    chunk_size = params["chunk_size"]
    if params["single_request"]:
        chunk_size = len(pending) if pending else chunk_size
        params["chunk_delay"] = 0.0
    
    glossary = load_glossary(params["glossary_path"])

    LOGGER.info(
        "LLM translate start provider=%s model=%s blocks=%s chunk=%s",
        resolved_provider, model or "", len(blocks_list), chunk_size,
    )

    # Process chunks
    for chunk_index, chunk in enumerate(chunked(pending, chunk_size), start=1):
        chunk_started = time.perf_counter()
        chunk_blocks, placeholder_maps, placeholder_tokens = prepare_chunk(
            chunk, use_placeholders, preferred_terms
        )
        context = build_context(params["context_strategy"], blocks_list, chunk_blocks)
        
        result = translate_chunk(
            translator, resolved_provider, chunk_blocks, target_language,
            context, preferred_terms, placeholder_tokens, tone, vision_context,
            params, chunk_index, fallback_on_error, mode,
        )
        
        apply_translation_results(
            chunk, placeholder_maps, result, translated_texts,
            cache, glossary, target_language, use_tm,
        )
        
        chunk_duration = time.perf_counter() - chunk_started
        LOGGER.info("LLM chunk %s completed in %.2fs", chunk_index, chunk_duration)
        if params["chunk_delay"]:
            time.sleep(params["chunk_delay"])

    final_texts = [text if text is not None else "" for text in translated_texts]
    return build_contract(
        blocks=blocks_list,
        translated_texts=final_texts,
        target_language=target_language,
    )


def _load_preferred_terms(
    source_lang: str, target_language: str, use_tm: bool
) -> list[tuple[str, str]]:
    """Load preferred terms from glossary and TM."""
    if source_lang and source_lang != "auto":
        preferred_terms = get_glossary_terms(source_lang, target_language)
        if use_tm:
            preferred_terms.extend(get_tm_terms(source_lang, target_language))
    else:
        preferred_terms = get_glossary_terms_any(target_language)
        if use_tm:
            preferred_terms.extend(get_tm_terms_any(target_language))
    return preferred_terms
