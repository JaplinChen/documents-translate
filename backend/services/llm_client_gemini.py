"""Google Gemini API client for translation.

This module provides the GeminiTranslator class with comprehensive
error handling for Gemini's REST API.
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


class GeminiTranslator:
    """Translator using Google Gemini's REST API."""
    
    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    def translate(
        self,
        blocks: Iterable[dict],
        target_language: str,
        context: dict | None = None,
        preferred_terms: list[tuple[str, str]] | None = None,
        placeholder_tokens: list[str] | None = None,
        language_hint: str | None = None,
    ) -> dict:
        """Translate blocks using Gemini API."""
        contract_example = load_contract_example()
        prompt = build_prompt(
            blocks,
            target_language,
            contract_example,
            context,
            preferred_terms,
            placeholder_tokens,
        )
        
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
        }
        
        data = json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        
        timeout = float(os.getenv("GEMINI_TIMEOUT", "180"))
        response_data = self._make_request(request, timeout)
        
        self._check_prompt_feedback(response_data)
        self._check_candidates(response_data)
        
        parts = response_data.get("candidates", [])[0].get("content", {}).get("parts", [])
        content = parts[0].get("text", "") if parts else ""
        
        if not content:
            raise ValueError("Gemini 回應內容為空。請檢查 API 設定或稍後再試。")
        
        result = safe_json_loads(content)
        validate_contract(result)
        return result

    def _make_request(self, request: Request, timeout: float) -> dict:
        """Make HTTP request with comprehensive error handling."""
        try:
            with urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except (socket.timeout, TimeoutError) as timeout_err:
            raise ValueError(
                f"Gemini API 請求超時 ({timeout:.0f} 秒)。"
                "請嘗試以下方法：\n"
                "1. 設定環境變數 GEMINI_TIMEOUT=300 增加超時時間\n"
                "2. 設定 LLM_CHUNK_SIZE=2 減少每次翻譯的區塊數量\n"
                "3. 選擇較快的模型如 gemini-1.5-flash"
            ) from timeout_err
        except URLError as url_err:
            if isinstance(url_err.reason, (socket.timeout, TimeoutError)):
                raise ValueError(
                    f"Gemini API 連線超時 ({timeout:.0f} 秒)。請檢查網路連線或稍後再試。"
                ) from url_err
            raise ValueError(
                f"Gemini API 網路錯誤: {url_err.reason}。請檢查網路連線或 API 端點設定。"
            ) from url_err
        except HTTPError as http_err:
            self._handle_http_error(http_err)

    def _handle_http_error(self, http_err: HTTPError) -> None:
        """Handle HTTP errors from Gemini API."""
        error_message = str(http_err)
        try:
            error_body = http_err.read().decode("utf-8")
            error_json = json.loads(error_body)
            error_message = error_json.get("error", {}).get("message", str(http_err))
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass

        error_messages = {
            400: (
                f"Gemini API 請求錯誤 (400): {error_message}。"
                "請檢查 API Key 是否有效或模型名稱是否正確。"
            ),
            403: (
                f"Gemini API 權限不足 (403): {error_message}。"
                "請確認 API Key 有權限存取此模型。"
            ),
            429: (
                f"Gemini API 請求過於頻繁 (429): {error_message}。"
                "請稍後再試或調整 LLM_CHUNK_DELAY 設定。"
            ),
        }
        
        if http_err.code in error_messages:
            raise ValueError(error_messages[http_err.code]) from http_err
        if http_err.code >= 500:
            raise ValueError(
                f"Gemini 伺服器錯誤 ({http_err.code}): {error_message}。請稍後再試。"
            ) from http_err
        raise ValueError(f"Gemini API 錯誤 ({http_err.code}): {error_message}") from http_err

    def _check_prompt_feedback(self, response_data: dict) -> None:
        """Check for prompt blocking in response."""
        prompt_feedback = response_data.get("promptFeedback", {})
        block_reason = prompt_feedback.get("blockReason")
        
        if block_reason:
            safety_ratings = prompt_feedback.get("safetyRatings", [])
            blocked_categories = [
                r.get("category", "") for r in safety_ratings if r.get("blocked", False)
            ]
            raise ValueError(
                f"Gemini 拒絕處理此請求 (blockReason={block_reason})。"
                f"被封鎖的分類：{', '.join(blocked_categories) or '未知'}。"
                "請檢查 PPTX 內容是否包含敏感文字。"
            )

    def _check_candidates(self, response_data: dict) -> None:
        """Check candidates and finish reason in response."""
        candidates = response_data.get("candidates", [])
        
        if not candidates:
            raise ValueError(
                "Gemini 未回傳任何結果 (candidates 為空)。可能是內容被過濾或請求格式有誤。"
            )

        finish_reason = candidates[0].get("finishReason", "")
        
        if finish_reason == "SAFETY":
            safety_ratings = candidates[0].get("safetyRatings", [])
            high_risk = [
                r.get("category", "") for r in safety_ratings
                if r.get("probability", "") in ("HIGH", "MEDIUM")
            ]
            raise ValueError(
                f"Gemini 因安全政策停止生成 (finishReason=SAFETY)。"
                f"高風險分類：{', '.join(high_risk) or '未知'}。"
                "請檢查 PPTX 內容是否包含敏感文字。"
            )
        elif finish_reason == "RECITATION":
            raise ValueError(
                "Gemini 因可能涉及版權內容停止生成 (finishReason=RECITATION)。"
            )
        elif finish_reason == "MAX_TOKENS":
            raise ValueError(
                "Gemini 輸出超過 token 上限 (finishReason=MAX_TOKENS)。"
                "請嘗試減少每次翻譯的區塊數量 (調整 LLM_CHUNK_SIZE)。"
            )

    def complete(self, prompt: str) -> str:
        """Complete a prompt using Gemini API."""
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0},
        }
        
        data = json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        
        timeout = float(os.getenv("GEMINI_TIMEOUT", "180"))
        with urlopen(request, timeout=timeout) as response:
            response_data = json.loads(response.read().decode("utf-8"))
        
        parts = response_data.get("candidates", [])[0].get("content", {}).get("parts", [])
        return parts[0].get("text", "") if parts else ""
