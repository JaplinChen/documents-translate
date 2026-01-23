import fitz  # PyMuPDF
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import tempfile
import os

from backend.contracts import make_block
from backend.services.extract_utils import is_numeric_only, is_technical_terms_only

def perform_ocr_on_page(pdf_path: str, page_index: int) -> list[dict]:
    """
    Use pdf2image and pytesseract to extract text from a specific PDF page.
    """
    try:
        # Convert only the specific page to image (dpi 200 for balance)
        images = convert_from_path(pdf_path, first_page=page_index+1, last_page=page_index+1, dpi=200)
        if not images:
            return []
        
        image = images[0]
        # Get OCR data with bounding boxes
        ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        
        blocks = []
        n_boxes = len(ocr_data['text'])
        
        # Skill: In Tesseract, level 5 is words, level 4 is lines. 
        # We'll group by line (block_num + line_num) for better translation context.
        line_map = {}
        
        for i in range(n_boxes):
            text = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i])
            if not text or conf < 10: # Lowered threshold for testing
                continue
            
            if is_numeric_only(text):
                continue
            
            # Key for line grouping
            key = (ocr_data['block_num'][i], ocr_data['line_num'][i])
            if key not in line_map:
                line_map[key] = {
                    "text": [],
                    "left": ocr_data['left'][i],
                    "top": ocr_data['top'][i],
                    "right": ocr_data['left'][i] + ocr_data['width'][i],
                    "bottom": ocr_data['top'][i] + ocr_data['height'][i]
                }
            
            line_map[key]["text"].append(text)
            line_map[key]["left"] = min(line_map[key]["left"], ocr_data['left'][i])
            line_map[key]["top"] = min(line_map[key]["top"], ocr_data['top'][i])
            line_map[key]["right"] = max(line_map[key]["right"], ocr_data['left'][i] + ocr_data['width'][i])
            line_map[key]["bottom"] = max(line_map[key]["bottom"], ocr_data['top'][i] + ocr_data['height'][i])

        # Scale factor (since pdf2image output depends on DPI)
        # 1 inch = 72 points in PDF. if DPI is 200, scale is 72/200
        scale = 72.0 / 200.0
        
        for key, val in line_map.items():
            full_text = " ".join(val["text"]).strip()
            if not full_text: continue
            
            block = make_block(
                slide_index=page_index,
                shape_id=2000 + key[0]*100 + key[1],
                block_type="pdf_text_block",
                source_text=full_text,
                x=val["left"] * scale,
                y=val["top"] * scale,
                width=(val["right"] - val["left"]) * scale,
                height=(val["bottom"] - val["top"]) * scale
            )
            block["is_ocr"] = True
            blocks.append(block)
            
        return blocks
    except Exception as e:
        print(f"OCR failed for page {page_index}: {e}")
        return []

def extract_blocks(pdf_path: str) -> dict:
    """
    Extract text blocks from a PDF file using PyMuPDF.

    Returns blocks with coordinate information for side-by-side or overlay.
    """
    doc = fitz.open(pdf_path)
    blocks: list[dict] = []

    for page_index, page in enumerate(doc):
        block_id_counter = 0
        text_dict = page.get_text("dict")
        page_has_text = False
        
        # Check for images to decide on OCR fallback
        has_images = any(b.get("type") == 1 for b in text_dict["blocks"])
        
        current_page_blocks = []
        for b in text_dict["blocks"]:
            if b.get("type") != 0:
                continue
            
            lines = b.get("lines", [])
            if not lines:
                continue
                
            block_text = ""
            first_span = lines[0]["spans"][0] if lines[0]["spans"] else {}
            font_size = first_span.get("size", 10.0)
            font_name = first_span.get("font", "helv")
            
            for line in lines:
                for span in line.get("spans", []):
                    block_text += span.get("text", "")
            
            text = block_text.strip()
            if not text or is_numeric_only(text) or is_technical_terms_only(text):
                continue
                
            page_has_text = True
            block_id_counter += 1
            x0, y0, x1, y1 = b.get("bbox")
            
            block = make_block(
                slide_index=page_index,
                shape_id=block_id_counter,
                block_type="pdf_text_block",
                source_text=text,
                x=x0, y=y0, width=x1-x0, height=y1-y0
            )
            block.update({
                "font_size": font_size,
                "font_name": font_name,
                "page_no": page_index + 1,
                "block_no": b.get("number", 0)
            })
            current_page_blocks.append(block)

        # Fallback to OCR if page seems empty
        if not current_page_blocks:
            ocr_blocks = perform_ocr_on_page(pdf_path, page_index)
            current_page_blocks.extend(ocr_blocks)
            
        blocks.extend(current_page_blocks)

    return {
        "blocks": blocks,
        "page_count": len(doc)
    }

