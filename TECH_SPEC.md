# Technical Requirement Document (PRD): Documents-Translate

## 1. Core Architecture

### Tech Stack

- **Backend**: Python 3.10+ (FastAPI), Uvicorn, Pydantic V2.
- **Frontend**: React 18 (Vite), Zustand (State Management), Tailwind CSS, i18next (i18n).
- **Processing**: `python-pptx`, `python-docx`, `openpyxl` (Excel), `PyMuPDF/fitz` (PDF), `reportlab`.
- **Infrastructure**: Docker & Docker Compose support.

### Design Patterns

- **Service Layer Pattern**: Each document format has its own service directory for extraction and application logic.
- **Unified Pipeline**: A consistent flow of `Extract -> Translate (SSE) -> Apply -> Export`.
- **Stateless API**: All file processing uses temporary directories; metadata is passed between FE/BE through JSON payloads.

---

## 2. Functional Matrix & User Flows

### Functionality Matrix

| Feature | Description | Support Status |
| :--- | :--- | :--- |
| **Multi-format Support** | PPTX, DOCX, XLSX, PDF | Fully Implemented |
| **Bilingual Preview** | Concurrent display of source and target text | Implemented |
| **LLM Translation** | Support for OpenAI, Gemini, Ollama providers | Implemented |
| **Format Preservation** | Styles, fonts, and layouts are preserved in output | Implemented |
| **Stream Processing** | Real-time translation updates via SSE | Implemented |

### User Flow

1. **Upload**: User uploads a document.
2. **Extraction**: Backend identifies format and extracts translatable blocks + coordinates.
3. **Review**: User reviews/edits extracted blocks in the browser.
4. **Translation**: SSE stream pushes translations block-by-block.
5. **Modification**: User manually fixes translation if needed.
6. **Export**: Backend overlays translations onto a copy of the original file.

---

## 3. Data Schema (Strict Definition)

### Central Contract: `PPTXBlock`

This JSON object is the primary unit of exchange between Frontend and Backend.

```typescript
interface PPTXBlock {
  slide_index: number;      // Page or Slide index (0-based)
  shape_id: number;         // ID within the page (e.g., Shape or Cell ID)
  block_type: "textbox" | "table_cell" | "notes" | "spreadsheet_cell" | "pdf_text_block";
  source_text: string;      // Original text content
  translated_text: string;  // Machine/User translated content
  mode: "direct" | "bilingual" | "correction";
  // Layout metadata (Points)
  x: number;
  y: number;
  width: number;
  height: number;
  // Style metadata (Optional)
  font_size?: number;
  font_name?: string;
  // Optional identifiers
  client_id?: string;
  page_no?: number;
}
```

---

## 4. UI/UX Design Tokens

- **Palette**: Dark-mode focused (e.g., Slate/Gray backgrounds), high-contrast text.
- **Typography**: Sans-serif stack (Inter/system-ui), dynamic font scaling for previews.
- **Components**:
  - **Sidebar**: Format-aware file selector and engine settings.
  - **LiveEditor**: Two-column layout (Source vs. Translation).
  - **SlidePreview**: SVG/HTML-based representation of document layout for visual context.

---

## 5. Technical Logic (Pseudocode)

### SSE Translation Workflow

```python
def translate_stream(blocks):
    for chunk in chunk_blocks(blocks):
        prompt = construct_prompt(chunk, glossary, tone)
        translations = call_llm(prompt)
        for block_id, text in translations:
            yield {
                "id": block_id,
                "translated_text": text,
                "status": "completed"
            }
```

### PDF Overlay Mechanism

```python
def apply_pdf_overlay(original_pdf, translations):
    doc = fitz.open(original_pdf)
    for block in translations:
        page = doc[block.slide_index]
        # Hide original
        page.draw_rect(block.rect, fill=WHITE)
        # Apply new
        page.insert_textbox(
            block.rect, 
            block.translated_text, 
            fontsize=block.font_size, 
            fontname=block.font_name
        )
    return doc.save()
```
