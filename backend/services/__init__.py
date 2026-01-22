from .pptx_apply_core import _apply_translations_to_presentation
from .pptx_service_translations import apply_translations
from .pptx_service_bilingual import apply_bilingual
from .pptx_service_corrections import apply_chinese_corrections

__all__ = [
    "_apply_translations_to_presentation",
    "apply_translations",
    "apply_bilingual",
    "apply_chinese_corrections",
]
