"""PPTX translation API endpoints.

This module provides REST API endpoints for translating PPTX content.
"""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import StreamingResponse

from backend.config import settings
from backend.contracts import coerce_blocks
from backend.services.language_detect import (
    detect_language,
    resolve_source_language,
)
from backend.services.llm_errors import (
    build_connection_refused_message,
    is_connection_refused,
)
from backend.services.translate_llm import translate_blocks_async as translate_pptx_blocks_async

LOGGER = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pptx")


def _prepare_blocks_for_correction(items: list[dict], source_language: str | None) -> list[dict]:
    """Prepare blocks for correction mode by filtering by source language."""
    if not source_language or source_language == "auto":
        return items
    prepared = []
    for block in items:
        text = block.get("source_text", "")
        if not text:
            prepared.append(block)
            continue
        lines = [line for line in text.splitlines() if detect_language(line) == source_language]
        prepared_block = dict(block)
        prepared_block["source_text"] = "\n".join(lines)
        prepared.append(prepared_block)
    return prepared


@router.post("/translate")
async def pptx_translate(
    blocks: str = Form(...),
    source_language: str | None = Form(None),
    secondary_language: str | None = Form(None),
    target_language: str | None = Form(None),
    mode: str = Form("bilingual"),
    use_tm: bool = Form(False),
    provider: str | None = Form(None),
    model: str | None = Form(None),
    api_key: str | None = Form(None),
    base_url: str | None = Form(None),
    ollama_fast_mode: bool = Form(False),
    tone: str | None = Form(None),
    vision_context: bool = Form(True),
    smart_layout: bool = Form(True),
) -> dict:
    """Translate text blocks using LLM."""
    llm_mode = settings.translate_llm_mode
    try:
        blocks_data = coerce_blocks(json.loads(blocks))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="blocks JSON 無效") from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail="blocks 資料無效 (translate)") from exc

    if not target_language:
        raise HTTPException(status_code=400, detail="target_language 為必填")

    resolved_source_language = resolve_source_language(blocks_data, source_language)

    param_overrides = {}
    if (provider or "").lower() == "ollama" and ollama_fast_mode:
        param_overrides = {"single_request": False, "chunk_size": 1, "chunk_delay": 0.0}

    try:
        translated = await translate_pptx_blocks_async(
            _prepare_blocks_for_correction(blocks_data, source_language)
            if mode == "correction"
            else blocks_data,
            target_language,
            source_language=resolved_source_language,
            use_tm=use_tm,
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
            tone=tone,
            vision_context=vision_context,
            smart_layout=smart_layout,
            param_overrides=param_overrides,
        )
    except Exception as exc:
        if provider == "ollama" and is_connection_refused(exc):
            raise HTTPException(
                status_code=400,
                detail=build_connection_refused_message(
                    "Ollama", base_url or "http://localhost:11434"
                ),
            ) from exc
        error_msg = str(exc)
        if "image" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=(
                    "翻譯失敗：偵測到圖片相關錯誤。您的 PPTX 可能包含圖片，"
                    "目前所選模型不支援圖片輸入。請在 LLM 設定中改用支援視覺模型"
                    "（例如 GPT-4o）。"
                ),
            ) from exc
        raise HTTPException(status_code=400, detail=error_msg) from exc

    return {
        "mode": mode,
        "source_language": resolved_source_language or source_language,
        "target_language": target_language,
        "blocks": translated.get("blocks", []),
        "llm_mode": llm_mode,
        "warning": "目前為 mock 模式，翻譯結果會回填原文。" if llm_mode == "mock" else None,
    }


@router.post("/translate-stream")
async def pptx_translate_stream(
    blocks: str = Form(...),
    source_language: str | None = Form(None),
    target_language: str | None = Form(None),
    mode: str = Form("bilingual"),
    use_tm: bool = Form(False),
    provider: str | None = Form(None),
    model: str | None = Form(None),
    api_key: str | None = Form(None),
    base_url: str | None = Form(None),
    ollama_fast_mode: bool = Form(False),
    tone: str | None = Form(None),
    vision_context: bool = Form(True),
    smart_layout: bool = Form(True),
) -> StreamingResponse:
    """Translate text blocks and stream progress via SSE."""
    try:
        blocks_data = coerce_blocks(json.loads(blocks))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="blocks 資料無效") from exc

    if not target_language:
        raise HTTPException(status_code=400, detail="target_language 為必填")

    resolved_source_language = resolve_source_language(blocks_data, source_language)

    param_overrides = {}
    if (provider or "").lower() == "ollama" and ollama_fast_mode:
        param_overrides = {"single_request": False, "chunk_size": 1, "chunk_delay": 0.0}

    async def event_generator():
        queue = asyncio.Queue()

        async def progress_cb(progress_data):
            await queue.put({"event": "progress", "data": json.dumps(progress_data)})

        try:
            # Send initial progress event to switch UI status from
            # "Preparing" to "Translating" immediately
            await queue.put(
                {
                    "event": "progress",
                    "data": json.dumps(
                        {
                            "chunk_index": 0,
                            "completed_indices": [],
                            "chunk_size": 0,
                            "total_pending": len(blocks_data),
                            "timestamp": 0,
                        }
                    ),
                }
            )

            task = asyncio.create_task(
                translate_pptx_blocks_async(
                    _prepare_blocks_for_correction(blocks_data, source_language)
                    if mode == "correction"
                    else blocks_data,
                    target_language,
                    source_language=resolved_source_language,
                    use_tm=use_tm,
                    provider=provider,
                    model=model,
                    api_key=api_key,
                    base_url=base_url,
                    tone=tone,
                    vision_context=vision_context,
                    smart_layout=smart_layout,
                    param_overrides=param_overrides,
                    on_progress=progress_cb,
                )
            )

            while True:
                get_queue_task = asyncio.create_task(queue.get())
                done, pending = await asyncio.wait(
                    [get_queue_task, task], return_when=asyncio.FIRST_COMPLETED
                )

                if get_queue_task in done:
                    event = get_queue_task.result()
                    yield f"event: {event['event']}\ndata: {event['data']}\n\n"
                else:
                    get_queue_task.cancel()

                if task in done:
                    result = await task
                    yield f"event: complete\ndata: {json.dumps(result)}\n\n"
                    break

        except Exception as exc:
            LOGGER.exception("Translation stream error")
            yield f"event: error\ndata: {json.dumps({'detail': str(exc)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
