"""PPTX API endpoints.

This module provides REST API endpoints for PPTX file extraction,
application of translated content, and language detection.
"""

from __future__ import annotations

import json
import os
import tempfile

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile

from backend.api.pptx_utils import validate_file_type
from backend.contracts import coerce_blocks
from backend.services.language_detect import detect_document_languages
from backend.services.pptx_apply import (
    apply_bilingual,
    apply_chinese_corrections,
    apply_translations,
)
from backend.services.pptx_extract import extract_blocks as extract_pptx_blocks

router = APIRouter(prefix="/api/pptx")


@router.post("/extract")
async def pptx_extract(file: UploadFile = File(...)) -> dict:
    """Extract text blocks from PPTX file."""
    valid, error_msg = validate_file_type(file.filename)
    if not valid:
        raise HTTPException(status_code=400, detail=error_msg)

    try:
        pptx_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="PPTX 檔案無效") from exc

    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, "input.pptx")
        with open(input_path, "wb") as handle:
            handle.write(pptx_bytes)
        blocks = extract_pptx_blocks(input_path)

    language_summary = detect_document_languages(blocks)
    return {"blocks": blocks, "language_summary": language_summary}


@router.post("/languages")
async def pptx_languages(file: UploadFile = File(...)) -> dict:
    """Detect languages in PPTX file."""
    valid, error_msg = validate_file_type(file.filename)
    if not valid:
        raise HTTPException(status_code=400, detail=error_msg)
    try:
        pptx_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="PPTX 檔案無效") from exc

    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, "input.pptx")
        with open(input_path, "wb") as handle:
            handle.write(pptx_bytes)
        blocks = extract_pptx_blocks(input_path)

    language_summary = detect_document_languages(blocks)
    return {"language_summary": language_summary}


@router.post("/apply")
async def pptx_apply(
    file: UploadFile = File(...),
    blocks: str = Form(...),
    mode: str = Form("bilingual"),
    bilingual_layout: str = Form("inline"),
    fill_color: str | None = Form(None),
    text_color: str | None = Form(None),
    line_color: str | None = Form(None),
    line_dash: str | None = Form(None),
) -> Response:
    """Apply translated blocks to PPTX file."""
    valid, error_msg = validate_file_type(file.filename)
    if not valid:
        raise HTTPException(status_code=400, detail=error_msg)
    try:
        pptx_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="PPTX 檔案無效") from exc

    try:
        blocks_data = coerce_blocks(json.loads(blocks))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="blocks JSON 無效") from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail="blocks 資料無效 (apply)") from exc

    if mode not in {"bilingual", "correction", "translated"}:
        raise HTTPException(status_code=400, detail="不支援的 mode")
    if mode == "bilingual" and bilingual_layout not in {"inline", "auto", "new_slide"}:
        raise HTTPException(status_code=400, detail="不支援的 bilingual layout")

    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, "input.pptx")
        output_path = os.path.join(temp_dir, "output.pptx")
        with open(input_path, "wb") as handle:
            handle.write(pptx_bytes)

        if mode == "bilingual":
            apply_bilingual(input_path, output_path, blocks_data, layout=bilingual_layout)
        elif mode == "translated":
            apply_translations(input_path, output_path, blocks_data, mode="direct")
        else:
            apply_chinese_corrections(
                input_path,
                output_path,
                blocks_data,
                fill_color=fill_color,
                text_color=text_color,
                line_color=line_color,
                line_dash=line_dash,
            )

        with open(output_path, "rb") as handle:
            output_bytes = handle.read()

    return Response(
        content=output_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": "attachment; filename=output.pptx"},
    )


@router.post("/extract-glossary")
async def pptx_extract_glossary(
    blocks: str = Form(...),
    target_language: str = Form("zh-TW"),
    provider: str | None = Form(None),
    model: str | None = Form(None),
    api_key: str | None = Form(None),
    base_url: str | None = Form(None),
) -> dict:
    """Extract glossary terms from blocks."""
    from backend.services.glossary_extraction import extract_glossary_terms

    try:
        blocks_data = json.loads(blocks)
        if not isinstance(blocks_data, list):
            raise ValueError("blocks must be a list")
    except Exception as exc:
        raise HTTPException(status_code=418, detail="blocks 資料無效 (glossary)") from exc

    try:
        terms = extract_glossary_terms(
            blocks_data,
            target_language,
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
        )
        return {"terms": terms}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
