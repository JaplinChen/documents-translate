import logging
from functools import lru_cache

import numpy as np
from paddleocr import PaddleOCR

LOGGER = logging.getLogger(__name__)


def map_paddle_lang(tesseract_lang: str) -> str:
    lang = (tesseract_lang or "").lower()
    if "chi_tra" in lang or "chi_sim" in lang or "zh" in lang:
        return "ch"
    if "vie" in lang or "vi" in lang:
        return "vi"
    return "en"


@lru_cache(maxsize=4)
def get_ocr(lang: str) -> PaddleOCR:
    return PaddleOCR(use_angle_cls=False, lang=lang)


def ocr_image(image, tesseract_lang: str) -> list[dict]:
    lang = map_paddle_lang(tesseract_lang)
    ocr = get_ocr(lang)
    result = ocr.ocr(np.array(image))
    lines = []
    if not result:
        return lines
    for line in result[0]:
        if not line or len(line) < 2:
            continue
        points, data = line
        text = data[0] if data else ""
        score = data[1] if data and len(data) > 1 else 0
        if not text:
            continue
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        lines.append(
            {
                "text": text,
                "score": score,
                "x0": min(xs),
                "y0": min(ys),
                "x1": max(xs),
                "y1": max(ys),
            }
        )
    return lines
