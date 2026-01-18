"""Ollama local LLM client for translation.

This module provides the OllamaTranslator class and related utilities
for interacting with locally running Ollama instances.
"""
from __future__ import annotations

import json
import os
import socket
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.services.llm_client_base import load_contract_example
from backend.services.llm_contract import validate_contract
from backend.services.llm_prompt import build_prompt
from backend.services.llm_utils import safe_json_loads
from backend.services.prompt_store import get_prompt


def build_ollama_options() -> dict:
    """Build Ollama-specific options from environment variables."""
    options: dict[str, int] = {}
    
    env_mappings = [
        ("OLLAMA_NUM_GPU", "num_gpu"),
        ("OLLAMA_NUM_GPU_LAYERS", "num_gpu_layers"),
        ("OLLAMA_NUM_CTX", "num_ctx"),
        ("OLLAMA_NUM_THREAD", "num_thread"),
    ]
    
    for env_var, option_key in env_mappings:
        value = os.getenv(env_var)
        if value:
            try:
                options[option_key] = int(value)
            except ValueError:
                pass
    
    force_gpu = os.getenv("OLLAMA_FORCE_GPU", "").lower() in {"1", "true", "yes"}
    if force_gpu and "num_gpu" not in options and "num_gpu_layers" not in options:
        options["num_gpu"] = 1

    return options


class OllamaTranslator:
    """Translator using locally running Ollama instance."""
    
    def __init__(self, model: str, base_url: str) -> None:
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = float(os.getenv("OLLAMA_TIMEOUT", "180"))

    def _post(self, endpoint: str, payload: dict) -> dict:
        """Make POST request to Ollama API."""
        data = json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.base_url}{endpoint}",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except (socket.timeout, TimeoutError) as timeout_err:
            raise ValueError(
                f"Ollama API 請求超時 ({self.timeout:.0f} 秒)。"
                "請嘗試增加 OLLAMA_TIMEOUT 或減少 LLM_CHUNK_SIZE。"
            ) from timeout_err
        except URLError as url_err:
            if isinstance(url_err.reason, (socket.timeout, TimeoutError)):
                raise ValueError(
                    f"Ollama API 連線超時 ({self.timeout:.0f} 秒)。"
                ) from url_err
            raise ValueError(
                f"無法連線至 Ollama ({self.base_url})。"
                "請確認 Ollama 已啟動且允許外部連線。"
            ) from url_err
        except HTTPError as http_err:
            raise ValueError(
                f"Ollama API 錯誤 ({http_err.code}): {http_err.reason}"
            ) from http_err

    def translate(
        self,
        blocks: Iterable[dict],
        target_language: str,
        context: dict | None = None,
        preferred_terms: list[tuple[str, str]] | None = None,
        placeholder_tokens: list[str] | None = None,
        language_hint: str | None = None,
    ) -> dict:
        """Translate blocks using Ollama API."""
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
            "model": self.model,
            "format": "json",
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
        }
        
        options = build_ollama_options()
        if options:
            payload["options"] = options

        response_data = self._post("/api/chat", payload)
        content = response_data.get("message", {}).get("content", "")
        
        if not content:
            raise ValueError("Ollama 回傳內容為空 (/api/chat)")

        result = safe_json_loads(content)
        validate_contract(result)
        return result

    def translate_plain(self, prompt: str) -> str:
        """Translate using plain text prompt (no JSON format)."""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }
        
        options = build_ollama_options()
        if options:
            payload["options"] = options

        response_data = self._post("/api/generate", payload)
        content = response_data.get("response", "")
        
        if not content:
            raise ValueError("Ollama 回傳內容為空 (/api/generate)")
        
        return content
