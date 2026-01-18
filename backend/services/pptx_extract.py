from __future__ import annotations

from typing import Iterable

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.slide import Slide
from pptx.table import _Cell
from pptx.text.text import TextFrame

import re
import json
from pathlib import Path
from backend.contracts import make_block

# Load preserve terms at module level for performance
def _load_preserve_terms() -> list[dict]:
    """Load preserve terms from JSON file."""
    preserve_file = Path(__file__).parent.parent / "data" / "preserve_terms.json"
    if not preserve_file.exists():
        return []
    try:
        with open(preserve_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

PRESERVE_TERMS = _load_preserve_terms()

def _is_numeric_only(text: str) -> bool:
    """Check if the text consists only of numbers, punctuation, or whitespace."""
    if not text.strip():
        return True
    # If it contains any letter (English, CJK), it's not purely numeric/symbolic
    if re.search(r'[a-zA-Z\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]', text):
        return False
    return True

def _is_technical_terms_only(text: str) -> bool:
    """
    Check if the text consists only of technical terms, product names, or acronyms.
    First checks against preserve_terms.json database, then falls back to auto-detection.
    """
    if not text.strip():
        return True
    
    # Priority 1: Check preserve terms database
    text_clean = text.strip()
    for term_entry in PRESERVE_TERMS:
        term = term_entry.get("term", "")
        case_sensitive = term_entry.get("case_sensitive", True)
        
        if case_sensitive:
            if text_clean == term:
                return True
        else:
            if text_clean.lower() == term.lower():
                return True
    
    # Priority 2: Auto-detection fallback
    # Remove common separators
    cleaned = re.sub(r'[,、，/\s]+', ' ', text).strip()
    
    # Check if contains any CJK characters (if yes, it's not pure technical terms)
    if re.search(r'[\u4e00-\u9fff\u3040-\u30ff\u0e00-\u0e7f]', cleaned):
        return False
    
    # Check if contains sentence-forming words (articles, prepositions, verbs)
    sentence_indicators = r'\b(the|a|an|is|are|was|were|be|have|has|had|do|does|did|will|would|can|could|should|may|might|must|please|this|that|these|those|with|from|to|in|on|at|for|of|and|or|but)\b'
    if re.search(sentence_indicators, cleaned, re.IGNORECASE):
        return False
    
    # Split into words
    words = cleaned.split()
    
    # Allow up to 10 words to accommodate term lists
    if len(words) <= 10:
        # Check if all words match technical term patterns
        # 1. All uppercase (SOP, CRM, API)
        # 2. Title case (Notion, Obsidian, Wiki)
        # 3. lowercase (wiki, database, tracker)
        # 4. Mixed case (GraphQL, iOS, macOS)
        technical_pattern = r'^[A-Z][a-z]*$|^[A-Z]+$|^[a-z]+$|^[A-Z][a-z]*[A-Z][a-zA-Z]*$'
        if all(re.match(technical_pattern, word) for word in words):
            return True
    
    return False

def _text_frame_to_text(text_frame: TextFrame) -> str:
    paragraphs = [paragraph.text for paragraph in text_frame.paragraphs]
    return "\n".join(paragraphs).strip()


def _iter_shapes(shapes) -> Iterable:
    for shape in shapes:
        yield shape
        try:
            if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
                yield from _iter_shapes(shape.shapes)
        except Exception:
            continue


def _iter_textbox_blocks(slide: Slide, slide_index: int) -> Iterable[dict]:
    for shape in _iter_shapes(slide.shapes):
        try:
            if not shape.has_text_frame or shape.has_table:
                continue
            text = _text_frame_to_text(shape.text_frame)
        except Exception:
            continue
        if not text or _is_numeric_only(text) or _is_technical_terms_only(text):
            continue
        yield make_block(slide_index, shape.shape_id, "textbox", text)


def _cell_to_text(cell: _Cell) -> str:
    return _text_frame_to_text(cell.text_frame)


def _iter_table_blocks(slide: Slide, slide_index: int) -> Iterable[dict]:
    for shape in _iter_shapes(slide.shapes):
        if not shape.has_table:
            continue
        for row in shape.table.rows:
            for cell in row.cells:
                text = _cell_to_text(cell)
                if not text or _is_numeric_only(text) or _is_technical_terms_only(text):
                    continue
                yield make_block(slide_index, shape.shape_id, "table_cell", text)


def _iter_notes_blocks(slide: Slide, slide_index: int) -> Iterable[dict]:
    if not slide.has_notes_slide:
        return
    for shape in _iter_shapes(slide.notes_slide.shapes):
        try:
            if not shape.has_text_frame:
                continue
            text = _text_frame_to_text(shape.text_frame)
        except Exception:
            continue
        if not text or _is_numeric_only(text) or _is_technical_terms_only(text):
            continue
        yield make_block(slide_index, shape.shape_id, "notes", text)


def extract_blocks(pptx_path: str) -> list[dict]:
    presentation = Presentation(pptx_path)
    blocks: list[dict] = []
    for slide_index, slide in enumerate(presentation.slides):
        blocks.extend(_iter_textbox_blocks(slide, slide_index))
        blocks.extend(_iter_table_blocks(slide, slide_index))
        blocks.extend(_iter_notes_blocks(slide, slide_index))
    return blocks
