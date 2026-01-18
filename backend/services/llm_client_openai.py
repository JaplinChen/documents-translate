"""OpenAI API client for translation.

This module provides the OpenAITranslator class for interacting
with OpenAI's chat completions API.
"""
from __future__ import annotations

import json
import os
from typing import Iterable
from urllib.request import Request, urlopen

from backend.services.llm_client_base import TranslationConfig, load_contract_example
from backend.services.llm_contract import validate_contract
from backend.services.llm_prompt import build_prompt
from backend.services.prompt_store import get_prompt


class OpenAITranslator:
    """Translator using OpenAI's chat completions API."""
    
    def __init__(self, config: TranslationConfig) -> None:
        self.config = config

    def translate(
        self,
        blocks: Iterable[dict],
        target_language: str,
        context: dict | None = None,
        preferred_terms: list[tuple[str, str]] | None = None,
        placeholder_tokens: list[str] | None = None,
        language_hint: str | None = None,
    ) -> dict:
        """Translate blocks using OpenAI API."""
        contract_example = load_contract_example()
        prompt = build_prompt(
            blocks,
            target_language,
            contract_example,
            context,
            preferred_terms,
            placeholder_tokens,
        )
        
        try:
            system_message = get_prompt("system_message")
        except FileNotFoundError:
            system_message = (
                "你是負責翻譯 PPTX 文字區塊的助手。"
                "只回傳 JSON，且必須符合既定 schema。"
            )
        
        payload = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }
        
        data = json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.config.base_url}/chat/completions",
            data=data,
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        
        timeout = float(os.getenv("OPENAI_TIMEOUT", "60"))
        with urlopen(request, timeout=timeout) as response:
            response_data = json.loads(response.read().decode("utf-8"))
        
        content = response_data["choices"][0]["message"]["content"]
        result = json.loads(content)
        validate_contract(result)
        return result

    def complete(self, prompt: str, system_message: str | None = None) -> str:
        """Complete a prompt using OpenAI API."""
        payload = {
            "model": self.config.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_message or "You are a helpful assistant.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
        }
        
        data = json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.config.base_url}/chat/completions",
            data=data,
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        
        timeout = float(os.getenv("OPENAI_TIMEOUT", "60"))
        with urlopen(request, timeout=timeout) as response:
            response_data = json.loads(response.read().decode("utf-8"))
        
        return response_data["choices"][0]["message"]["content"]
