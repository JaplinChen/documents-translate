from backend.services.pptx_service_translations import apply_translations
from backend.services.pptx_service_bilingual import apply_bilingual
from backend.services.pptx_service_corrections import apply_chinese_corrections

__all__ = ["apply_bilingual", "apply_chinese_corrections", "apply_translations"]
