import logging
import os
from pathlib import Path
import fitz  # PyMuPDF
import pytesseract
from pdf2image import convert_from_path

try:
    import pdfplumber
except Exception:  # pragma: no cover - optional dependency
    pdfplumber = None

from backend.contracts import make_block
from backend.services.extract_utils import is_numeric_only, is_technical_terms_only
from backend.services.pdf.ocr_paddle import ocr_image as paddle_ocr_image


def is_noisy_text(text: str) -> bool:
    cleaned = (text or "").strip()
    if not cleaned:
        return True
    if len(cleaned) <= 2:
        return True
    letters = sum(ch.isalpha() for ch in cleaned)
    digits = sum(ch.isdigit() for ch in cleaned)
    spaces = sum(ch.isspace() for ch in cleaned)
    other = len(cleaned) - letters - digits - spaces
    if letters == 0 and digits == 0:
        return True
    total = max(len(cleaned), 1)
    if other / total > 0.35:
        return True
    if letters > 0 and letters / total < 0.3:
        return True
    return False

LOGGER = logging.getLogger(__name__)


def get_ocr_config() -> dict:
    try:
        dpi = int(os.getenv("PDF_OCR_DPI", "200"))
    except ValueError:
        dpi = 200

    lang = os.getenv("PDF_OCR_LANG", "eng")

    try:
        conf_min = int(os.getenv("PDF_OCR_CONF_MIN", "10"))
    except ValueError:
        conf_min = 10

    try:
        psm = int(os.getenv("PDF_OCR_PSM", "6"))
    except ValueError:
        psm = 6

    engine = os.getenv("PDF_OCR_ENGINE", "tesseract").lower()

    return {
        "dpi": dpi,
        "lang": lang,
        "conf_min": conf_min,
        "psm": psm,
        "engine": engine,
    }


def get_poppler_path() -> str | None:
    env_path = os.getenv("PDF_POPPLER_PATH", "").strip()
    if env_path:
        if Path(env_path).exists():
            return env_path
        LOGGER.warning("PDF_POPPLER_PATH not found: %s", env_path)

    project_root = Path(__file__).resolve().parents[3]
    default_path = project_root / "tools" / "poppler" / "Library" / "bin"
    if default_path.exists():
        return str(default_path)

    return None


def get_table_config() -> dict:
    def read_int(name: str, default: int) -> int:
        try:
            return int(os.getenv(name, str(default)))
        except ValueError:
            return default

    return {
        "vertical_strategy": os.getenv("PDF_TABLE_VERTICAL_STRATEGY", "lines"),
        "horizontal_strategy": os.getenv("PDF_TABLE_HORIZONTAL_STRATEGY", "lines"),
        "snap_tolerance": read_int("PDF_TABLE_SNAP_TOL", 3),
        "join_tolerance": read_int("PDF_TABLE_JOIN_TOL", 3),
        "edge_min_length": read_int("PDF_TABLE_EDGE_MIN_LEN", 3),
        "intersection_tolerance": read_int("PDF_TABLE_INTERSECTION_TOL", 3),
    }


def perform_ocr_on_page(pdf_path: str, page_index: int, config: dict | None = None) -> list[dict]:
    """
    Use pdf2image and pytesseract to extract text from a specific PDF page.
    """
    cfg = config or get_ocr_config()
    dpi = cfg["dpi"]
    lang = cfg["lang"]
    conf_min = cfg["conf_min"]
    psm = cfg.get("psm", 6)

    try:
        poppler_path = get_poppler_path()
        images = convert_from_path(
            pdf_path,
            first_page=page_index + 1,
            last_page=page_index + 1,
            dpi=dpi,
            poppler_path=poppler_path,
        )
        if not images:
            return []

        image = images[0]
        ocr_data = pytesseract.image_to_data(
            image,
            output_type=pytesseract.Output.DICT,
            lang=lang,
            config=f"--psm {psm}",
        )

        blocks = []
        n_boxes = len(ocr_data["text"])

        line_map = {}

        for i in range(n_boxes):
            text = ocr_data["text"][i].strip()
            try:
                conf = int(ocr_data["conf"][i])
            except ValueError:
                conf = -1

            if not text or conf < conf_min:
                continue

            if is_numeric_only(text) or is_noisy_text(text):
                continue

            key = (ocr_data["block_num"][i], ocr_data["line_num"][i])
            if key not in line_map:
                line_map[key] = {
                    "text": [],
                    "left": ocr_data["left"][i],
                    "top": ocr_data["top"][i],
                    "right": ocr_data["left"][i] + ocr_data["width"][i],
                    "bottom": ocr_data["top"][i] + ocr_data["height"][i],
                }

            line_map[key]["text"].append(text)
            line_map[key]["left"] = min(line_map[key]["left"], ocr_data["left"][i])
            line_map[key]["top"] = min(line_map[key]["top"], ocr_data["top"][i])
            line_map[key]["right"] = max(line_map[key]["right"], ocr_data["left"][i] + ocr_data["width"][i])
            line_map[key]["bottom"] = max(line_map[key]["bottom"], ocr_data["top"][i] + ocr_data["height"][i])

        scale = 72.0 / float(dpi)

        for key, val in line_map.items():
            full_text = " ".join(val["text"]).strip()
            if not full_text:
                continue

            block = make_block(
                slide_index=page_index,
                shape_id=2000 + key[0] * 100 + key[1],
                block_type="pdf_text_block",
                source_text=full_text,
                x=val["left"] * scale,
                y=val["top"] * scale,
                width=(val["right"] - val["left"]) * scale,
                height=(val["bottom"] - val["top"]) * scale,
            )
            block["is_ocr"] = True
            blocks.append(block)

        return blocks
    except Exception as exc:
        LOGGER.warning("OCR failed for page %s: %s", page_index + 1, exc)
        return []


def perform_paddle_ocr_on_page(pdf_path: str, page_index: int, config: dict | None = None) -> list[dict]:
    cfg = config or get_ocr_config()
    dpi = cfg["dpi"]
    lang = cfg["lang"]

    try:
        poppler_path = get_poppler_path()
        images = convert_from_path(
            pdf_path,
            first_page=page_index + 1,
            last_page=page_index + 1,
            dpi=dpi,
            poppler_path=poppler_path,
        )
        if not images:
            return []

        scale = 72.0 / float(dpi)
        lines = paddle_ocr_image(images[0], lang)
        blocks = []
        for idx, line in enumerate(lines, start=1):
            text = (line.get("text") or "").strip()
            if not text or is_noisy_text(text):
                continue
            block = make_block(
                slide_index=page_index,
                shape_id=4000 + idx,
                block_type="pdf_text_block",
                source_text=text,
                x=line["x0"] * scale,
                y=line["y0"] * scale,
                width=(line["x1"] - line["x0"]) * scale,
                height=(line["y1"] - line["y0"]) * scale,
            )
            block["is_ocr"] = True
            block["ocr_engine"] = "paddle"
            blocks.append(block)
        return blocks
    except Exception as exc:
        LOGGER.warning("PaddleOCR failed for page %s: %s", page_index + 1, exc)
        return []


def extract_table_blocks(plumber_page, page_index: int, page_image, cfg: dict, force_cell_ocr: bool) -> list[dict]:
    blocks: list[dict] = []
    if not plumber_page:
        return blocks

    try:
        tables = plumber_page.find_tables(table_settings=get_table_config())
    except Exception as exc:
        LOGGER.warning("pdf table detect failed page=%s: %s", page_index + 1, exc)
        return blocks

    for table_index, table in enumerate(tables, start=1):
        try:
            cells = table.cells or []
        except Exception:
            cells = []

        cell_text_map = {}
        if cells:
            try:
                cell_text_map = table.extract() or {}
            except Exception:
                cell_text_map = {}

        if not cells:
            try:
                rows = table.extract() or []
            except Exception as exc:
                LOGGER.warning("pdf table extract failed page=%s table=%s: %s", page_index + 1, table_index, exc)
                continue

            row_texts = []
            for row in rows:
                if not row:
                    continue
                row_texts.append("\t".join(cell or "" for cell in row).strip())

            full_text = "\n".join([r for r in row_texts if r]).strip()
            if not full_text or is_noisy_text(full_text):
                continue

            try:
                x0, top, x1, bottom = table.bbox
            except Exception:
                continue

            block = make_block(
                slide_index=page_index,
                shape_id=900000 + page_index * 1000 + table_index,
                block_type="pdf_text_block",
                source_text=full_text,
                x=x0,
                y=top,
                width=x1 - x0,
                height=bottom - top,
            )
            block.update({"is_table": True, "page_no": page_index + 1, "table_no": table_index})
            blocks.append(block)
            continue

        dpi = cfg.get("dpi", 200)
        lang = cfg.get("lang", "eng")
        psm = cfg.get("psm", 6)
        engine = cfg.get("engine", "tesseract")
        scale = float(dpi) / 72.0

        for cell_index, cell in enumerate(cells, start=1):
            try:
                x0 = cell.get("x0")
                top = cell.get("top")
                x1 = cell.get("x1")
                bottom = cell.get("bottom")
            except Exception:
                continue

            if x0 is None or top is None or x1 is None or bottom is None:
                continue

            text = (cell.get("text") or "").strip()
            row_index = None
            col_index = None
            if cell_text_map:
                for r_idx, row in enumerate(cell_text_map, start=1):
                    if not row:
                        continue
                    for c_idx, cell_text in enumerate(row, start=1):
                        if cell_text is None:
                            continue
                        if cell_text.strip() == text and row_index is None and col_index is None:
                            row_index = r_idx
                            col_index = c_idx
                        break
                    if row_index is not None:
                        break

            if force_cell_ocr or not text:
                if page_image is not None:
                    left = max(int(x0 * scale), 0)
                    upper = max(int(top * scale), 0)
                    right = max(int(x1 * scale), left + 1)
                    lower = max(int(bottom * scale), upper + 1)
                    try:
                        cropped = page_image.crop((left, upper, right, lower))
                        if engine == "paddle":
                            lines = paddle_ocr_image(cropped, lang)
                            text = " ".join([l.get("text", "") for l in lines]).strip()
                        else:
                            text = (pytesseract.image_to_string(cropped, lang=lang, config=f"--psm {psm}") or "").strip()
                    except Exception:
                        text = ""
            if not text and not force_cell_ocr:
                try:
                    text = (plumber_page.crop((x0, top, x1, bottom)).extract_text() or "").strip()
                except Exception:
                    text = ""

            if not text or is_noisy_text(text):
                continue

            block = make_block(
                slide_index=page_index,
                shape_id=900000 + page_index * 100000 + table_index * 1000 + cell_index,
                block_type="pdf_text_block",
                source_text=text,
                x=x0,
                y=top,
                width=x1 - x0,
                height=bottom - top,
            )
            block.update(
                {
                    "is_table": True,
                    "page_no": page_index + 1,
                    "table_no": table_index,
                    "cell_no": cell_index,
                    "row_no": row_index,
                    "col_no": col_index,
                }
            )
            blocks.append(block)

    return blocks


def extract_blocks(pdf_path: str) -> dict:
    """
    Extract text blocks from a PDF file using PyMuPDF.

    Returns blocks with coordinate information for side-by-side or overlay.
    """
    doc = fitz.open(pdf_path)
    plumber_doc = None
    if pdfplumber:
        try:
            plumber_doc = pdfplumber.open(pdf_path)
        except Exception as exc:
            LOGGER.warning("pdfplumber open failed: %s", exc)
    blocks: list[dict] = []
    cfg = get_ocr_config()

    for page_index, page in enumerate(doc):
        block_id_counter = 0
        text_dict = page.get_text("dict")

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

            block_id_counter += 1
            x0, y0, x1, y1 = b.get("bbox")

            block = make_block(
                slide_index=page_index,
                shape_id=block_id_counter,
                block_type="pdf_text_block",
                source_text=text,
                x=x0,
                y=y0,
                width=x1 - x0,
                height=y1 - y0,
            )
            block.update(
                {
                    "font_size": font_size,
                    "font_name": font_name,
                    "page_no": page_index + 1,
                    "block_no": b.get("number", 0),
                }
            )
            current_page_blocks.append(block)

        if plumber_doc and page_index < len(plumber_doc.pages):
            force_cell_ocr = len(current_page_blocks) == 0
            page_image = None
            if force_cell_ocr:
                try:
                    poppler_path = get_poppler_path()
                    images = convert_from_path(
                        pdf_path,
                        first_page=page_index + 1,
                        last_page=page_index + 1,
                        dpi=cfg["dpi"],
                        poppler_path=poppler_path,
                    )
                    page_image = images[0] if images else None
                except Exception:
                    page_image = None

            table_blocks = extract_table_blocks(plumber_doc.pages[page_index], page_index, page_image, cfg, force_cell_ocr)
            if table_blocks:
                existing_texts = {b.get("source_text", "").strip() for b in current_page_blocks}
                for tb in table_blocks:
                    if tb.get("source_text", "").strip() not in existing_texts:
                        current_page_blocks.append(tb)

        ocr_blocks = []
        if not current_page_blocks:
            if cfg.get("engine") == "paddle":
                ocr_blocks = perform_paddle_ocr_on_page(pdf_path, page_index, cfg)
            else:
                ocr_blocks = perform_ocr_on_page(pdf_path, page_index, cfg)
            current_page_blocks.extend(ocr_blocks)

        LOGGER.info(
            "pdf_extract page=%s text_blocks=%s ocr_blocks=%s has_images=%s",
            page_index + 1,
            len(current_page_blocks) - len(ocr_blocks),
            len(ocr_blocks),
            has_images,
        )

        blocks.extend(current_page_blocks)

    if plumber_doc:
        plumber_doc.close()

    LOGGER.info("pdf_extract complete pages=%s blocks=%s", len(doc), len(blocks))

    return {"blocks": blocks, "page_count": len(doc)}
