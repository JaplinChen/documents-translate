"""Translator selection and configuration utilities.

This module provides translator instantiation and parameter
configuration based on provider and environment settings.
"""
from __future__ import annotations

import os

from backend.services.llm_clients import (
    GeminiTranslator,
    MockTranslator,
    OllamaTranslator,
    OpenAITranslator,
    TranslationConfig,
)
from backend.services.translate_config import PROVIDER_DEFAULTS


def select_translator(
    provider: str | None,
    model: str | None,
    api_key: str | None,
    base_url: str | None,
    fallback_on_error: bool,
) -> tuple[str, object]:
    """Select and instantiate the appropriate translator.
    
    Args:
        provider: LLM provider name (openai, gemini, ollama)
        model: Model name to use
        api_key: API key for the provider
        base_url: Base URL for the API
        fallback_on_error: Whether to fallback to mock on error
        
    Returns:
        Tuple of (resolved_provider_name, translator_instance)
    """
    resolved_provider = (provider or "openai").lower()
    
    if resolved_provider in {"openai", "chatgpt", "gpt-4o"}:
        return _create_openai_translator(
            resolved_provider, model, api_key, base_url, fallback_on_error
        )
    
    if resolved_provider == "gemini":
        return _create_gemini_translator(model, api_key, base_url, fallback_on_error)
    
    if resolved_provider == "ollama":
        return _create_ollama_translator(model, base_url)
    
    return "mock", MockTranslator()


def _create_openai_translator(
    provider: str,
    model: str | None,
    api_key: str | None,
    base_url: str | None,
    fallback_on_error: bool,
) -> tuple[str, object]:
    """Create OpenAI translator instance."""
    resolved_key = api_key or os.getenv("OPENAI_API_KEY", "")
    if not resolved_key:
        if fallback_on_error:
            return "mock", MockTranslator()
        raise EnvironmentError("OPENAI_API_KEY is required for OpenAI translation")
    
    model_name = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if provider == "gpt-4o" and not model:
        model_name = "gpt-4o"
    
    config = TranslationConfig(
        model=model_name,
        api_key=resolved_key,
        base_url=base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
    )
    return "openai", OpenAITranslator(config)


def _create_gemini_translator(
    model: str | None,
    api_key: str | None,
    base_url: str | None,
    fallback_on_error: bool,
) -> tuple[str, object]:
    """Create Gemini translator instance."""
    resolved_key = api_key or os.getenv("GEMINI_API_KEY", "")
    if not resolved_key:
        if fallback_on_error:
            return "mock", MockTranslator()
        raise EnvironmentError("GEMINI_API_KEY is required for Gemini translation")
    
    return "gemini", GeminiTranslator(
        api_key=resolved_key,
        base_url=base_url or os.getenv(
            "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"
        ),
        model=model or os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
    )


def _create_ollama_translator(
    model: str | None,
    base_url: str | None,
) -> tuple[str, object]:
    """Create Ollama translator instance."""
    resolved_model = model or os.getenv("OLLAMA_MODEL", "llama3.1")
    return "ollama", OllamaTranslator(
        model=resolved_model,
        base_url=base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    )


def get_translation_params(provider: str) -> dict:
    """Get translation parameters based on provider and environment.
    
    Args:
        provider: LLM provider name
        
    Returns:
        Dictionary with chunk_size, max_retries, chunk_delay, etc.
    """
    defaults = PROVIDER_DEFAULTS.get(provider, PROVIDER_DEFAULTS.get("openai", {}))
    
    chunk_size = int(os.getenv("LLM_CHUNK_SIZE", str(defaults.get("chunk_size", 40))))
    if provider in PROVIDER_DEFAULTS and "LLM_CHUNK_SIZE" not in os.environ:
        chunk_size = defaults.get("chunk_size", 40)
    
    max_retries = int(os.getenv("LLM_MAX_RETRIES", str(defaults.get("max_retries", 2))))
    if provider in PROVIDER_DEFAULTS and "LLM_MAX_RETRIES" not in os.environ:
        max_retries = defaults.get("max_retries", 2)
    
    chunk_delay = float(os.getenv("LLM_CHUNK_DELAY", str(defaults.get("chunk_delay", 0))))
    if provider in PROVIDER_DEFAULTS and "LLM_CHUNK_DELAY" not in os.environ:
        chunk_delay = defaults.get("chunk_delay", 0)
    
    single_request = os.getenv("LLM_SINGLE_REQUEST", "1").lower() in {"1", "true", "yes"}
    if provider in PROVIDER_DEFAULTS and "LLM_SINGLE_REQUEST" not in os.environ:
        single_request = defaults.get("single_request", True)
    
    return {
        "chunk_size": chunk_size,
        "max_retries": max_retries,
        "chunk_delay": chunk_delay,
        "single_request": single_request,
        "backoff": float(os.getenv("LLM_RETRY_BACKOFF", "0.8")),
        "max_backoff": float(os.getenv("LLM_RETRY_MAX_BACKOFF", "8")),
        "context_strategy": os.getenv("LLM_CONTEXT_STRATEGY", "none").lower(),
        "glossary_path": os.getenv("LLM_GLOSSARY_PATH", ""),
    }
