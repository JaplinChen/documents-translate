"""Translation retry and language validation logic.

This module contains language matching, mismatch detection,
retry context building, and translation result processing.
"""
from __future__ import annotations

import os

from backend.services.language_detect import detect_language
from backend.services.llm_glossary import apply_glossary
from backend.services.llm_placeholders import has_placeholder, restore_placeholders
from backend.services.llm_utils import cache_key
from backend.services.translate_config import get_language_hint
from backend.services.translation_memory import save_tm


def matches_target_language(text: str, target_language: str) -> bool:
    """Check if text matches the target language.
    
    Args:
        text: Text to check
        target_language: Expected language code
        
    Returns:
        True if text matches target language or cannot be determined
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return True
    detected = detect_language(cleaned)
    if not detected:
        return True
    target = (target_language or "").strip()
    if not target:
        return True
    if target.startswith("zh-"):
        return detected == target
    if target == "zh":
        return detected.startswith("zh")
    return detected == target


def has_language_mismatch(texts: list[str], target_language: str) -> bool:
    """Check if translated texts have language mismatch.
    
    Returns False (no mismatch) if:
    - No target language specified
    - Target language is 'auto'
    - Majority of texts match the target language
    
    Args:
        texts: List of translated texts
        target_language: Expected language code
        
    Returns:
        True if majority of texts don't match target language
    """
    if not target_language or target_language == "auto":
        return False
    if not texts:
        return False
    
    # Early termination optimization: stop checking once we know the result
    total = len(texts)
    threshold = total * 0.5
    matching_count = 0
    
    for text in texts:
        if matches_target_language(text, target_language):
            matching_count += 1
            # Early exit if we've already passed threshold
            if matching_count >= threshold:
                return False
    
    return matching_count < threshold



def build_language_retry_context(
    context: dict | None, texts: list[str], target_language: str
) -> dict:
    """Build context for language mismatch retry.
    
    Args:
        context: Original context dictionary
        texts: Translated texts with wrong language
        target_language: Expected language code
        
    Returns:
        Updated context with language retry instructions
    """
    updated = dict(context or {})
    detected_counts: dict[str, int] = {}
    for text in texts:
        detected = detect_language((text or "").strip())
        if detected:
            detected_counts[detected] = detected_counts.get(detected, 0) + 1
    detected_top = (
        sorted(detected_counts.items(), key=lambda item: item[1], reverse=True)[0][0]
        if detected_counts
        else None
    )
    updated["language_guard"] = (
        f"上一輪輸出偵測語言為 {detected_top}，不符合目標語言 {target_language}。"
        "請重新翻譯並確保每個 translated_text 都是目標語言。"
    )
    hint = get_language_hint(target_language)
    if hint:
        updated["language_hint"] = hint
    return updated


def apply_translation_results(
    chunk: list[tuple[int, dict]],
    placeholder_maps: list[dict[str, str]],
    result: dict,
    translated_texts: list[str | None],
    cache: dict[str, str],
    glossary: dict | None,
    target_language: str,
    use_tm: bool,
) -> None:
    """Apply translation results to output list.
    
    This function handles placeholder restoration, glossary application,
    caching, and translation memory saving.
    
    Args:
        chunk: List of (original_index, block) tuples
        placeholder_maps: List of placeholder mappings per block
        result: Translation result from LLM
        translated_texts: Output list to update
        cache: Translation cache dictionary
        glossary: Optional glossary dictionary
        target_language: Target language code
        use_tm: Whether to save to translation memory
    """
    for (original, mapping), translated in zip(
        zip(chunk, placeholder_maps), result["blocks"]
    ):
        if "client_id" not in translated and original[1].get("client_id"):
            translated["client_id"] = original[1].get("client_id")
        
        translated_text = translated.get("translated_text", "")
        translated_text = restore_placeholders(translated_text, mapping)
        
        if glossary:
            translated_text = apply_glossary(translated_text, glossary)
        
        translated_texts[original[0]] = translated_text
        key = cache_key(original[1])
        
        if (
            use_tm
            and not has_placeholder(translated_text)
            and matches_target_language(translated_text, target_language)
        ):
            cache[key] = translated_text
            save_tm(
                source_lang=os.getenv("SOURCE_LANGUAGE", "auto"),
                target_lang=target_language,
                text=key,
                translated=translated_text,
            )
