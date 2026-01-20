"""PPTX API endpoints.

This module provides REST API endpoints for PPTX file extraction,
application of translated content, and language detection.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import uuid
import time
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse

LOGGER = logging.getLogger(__name__)

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


def get_next_sequence(base_pattern: str) -> str:
    """Get the next 3-digit sequence number for a given filename pattern today."""
    export_dir = Path("data/exports")
    export_dir.mkdir(parents=True, exist_ok=True)
    
    # base_pattern 應該是 [原名]-[模式]-[版面]-YYYYMMDD-
    existing_files = list(export_dir.glob(f"{base_pattern}*.pptx"))
    
    max_seq = 0
    for f in existing_files:
        try:
            # 檔名格式: pattern-XXX.pptx
            name_part = f.stem
            seq_str = name_part.replace(base_pattern, "")
            if seq_str.isdigit():
                max_seq = max(max_seq, int(seq_str))
        except (ValueError, IndexError):
            continue
            
    return f"{max_seq + 1:03d}"


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
        data = extract_pptx_blocks(input_path)
        blocks = data["blocks"]
        slide_width = data["slide_width"]
        slide_height = data["slide_height"]

    language_summary = detect_document_languages(blocks)
    return {
        "blocks": blocks,
        "language_summary": language_summary,
        "slide_width": slide_width,
        "slide_height": slide_height
    }



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
        data = extract_pptx_blocks(input_path)
        blocks = data["blocks"]

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
    font_mapping: str | None = Form(None),
    target_language: str | None = Form(None),
) -> dict:
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

    # Parse font_mapping if provided
    parsed_font_mapping = None
    if font_mapping:
        try:
            parsed_font_mapping = json.loads(font_mapping)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="font_mapping JSON 無效")

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
            apply_bilingual(
                input_path,
                output_path,
                blocks_data,
                layout=bilingual_layout,
                target_language=target_language,
                font_mapping=parsed_font_mapping,
            )
        elif mode == "translated":
            apply_translations(
                input_path,
                output_path,
                blocks_data,
                mode="direct",
                target_language=target_language,
                font_mapping=parsed_font_mapping,
            )
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

    # --- 語義化檔名生成 (V12) ---
    # 格式: [原檔名]-[選擇的模式]-[選擇的版面]-YYYYMMDD-[3位流水號].pptx
    original_filename = file.filename or "output.pptx"
    base_name, _ = os.path.splitext(original_filename)
    
    # 清理檔名中的非法字元，避免路徑解析錯誤
    import re
    safe_base = re.sub(r'[\\/*?:"<>|]', "_", base_name)
    
    date_str = time.strftime("%Y%m%d")
    
    # 確定模式與版面標籤
    mode_label = mode
    layout_label = bilingual_layout if mode == "bilingual" else "none"
    
    # 建立基礎模式
    pattern = f"{safe_base}-{mode_label}-{layout_label}-{date_str}-"
    sequence = get_next_sequence(pattern)
    
    final_filename = f"{pattern}{sequence}.pptx"
    
    # 持久化存儲
    export_dir = Path("data/exports")
    export_dir.mkdir(parents=True, exist_ok=True)
    save_path = export_dir / final_filename
    
    with open(save_path, "wb") as f:
        f.write(output_bytes)
        
    import urllib.parse
    # URL 編碼檔名，用於下載連結。使用 safe='' 強制編碼所有特殊字元。
    safe_uri_filename = urllib.parse.quote(final_filename, safe='')

    # 傳回基於實體路徑的 URL
    return {
        "status": "success",
        "filename": final_filename,
        "download_url": f"/api/pptx/download/{safe_uri_filename}",
        "version": "20260120-V12-ENCODING-FIX"
    }


@router.get("/download/{filename:path}")
async def pptx_download(filename: str):
    """Download a processed PPTX file by its semantic filename."""
    import urllib.parse
    # 預防性解碼：有些環境可能會對路徑參數進行自動解碼，有些則不。
    # 如果 filename 包含 %，嘗試進行一次解碼以應對雙重編碼問題。
    if "%" in filename:
        decoded_filename = urllib.parse.unquote(filename)
        LOGGER.info(f"[DOWNLOAD_TRACE] Decoded filename: {decoded_filename}")
        filename = decoded_filename

    LOGGER.info(f"[DOWNLOAD_TRACE] Request received for filename: {filename}")
    export_dir = Path("data/exports")
    file_path = export_dir / filename
    
    if not file_path.exists():
        LOGGER.error(f"[DOWNLOAD_TRACE] File not found: {file_path}")
        raise HTTPException(status_code=404, detail="檔案不存在或已過期")
        
    import urllib.parse
    # 建立 ASCII 降級名稱 (將非 ASCII 轉為底線)
    ascii_filename = "".join(c if ord(c) < 128 else "_" for c in filename)
    # 進行完整的 URL 編碼供 RFC 5987 使用
    safe_filename = urllib.parse.quote(filename, safe='')

    # 標準下載標頭
    content_disposition = f'attachment; filename="{ascii_filename}"; filename*=UTF-8\'\'{safe_filename}'

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": content_disposition,
            "Access-Control-Expose-Headers": "Content-Disposition",
            "Cache-Control": "no-cache"
        },
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


@router.get("/debug-version")
async def pptx_debug_version():
    """Version check for debugging Docker sync issues."""
    return {"version": "20260120-V12-ENCODING-FIX"}
