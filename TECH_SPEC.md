# PPTX Translate - Technical Specification Document

## 1. Core Architecture

### 1.1 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend** | Python / FastAPI | 3.13+ |
| **Frontend** | React / Vite | 18.3.1 / 7.3.1 |
| **Styling** | TailwindCSS | 3.4.17 |
| **Data Validation** | Pydantic | 2.x |
| **HTTP Client** | httpx | async |
| **Database** | SQLite | embedded |
| **Container** | Docker / docker-compose | - |

### 1.2 Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vite + React)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Sidebar  │ │ Editor   │ │ Settings │ │ Manage   │            │
│  │ (Upload) │ │ (Blocks) │ │ (LLM)    │ │ (TM/GL)  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API / SSE
┌───────────────────────────┴─────────────────────────────────────┐
│                         BACKEND (FastAPI)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      API Layer (11 routers)                 │ │
│  │  pptx | pptx_translate | tm | llm | export | preserve_terms │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│  ┌──────────────────────────┴─────────────────────────────────┐ │
│  │                    Service Layer (38 modules)               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │ translate_* │  │ llm_client_*│  │ pptx_*      │         │ │
│  │  │ (5 modules) │  │ (4 modules) │  │ (4 modules) │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Data Layer                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │ translation_ │  │ translation_ │  │ glossary     │      │ │
│  │  │ memory.db    │  │ cache.db     │  │ .json        │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                      LLM Providers                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ OpenAI   │  │ Gemini   │  │ Ollama   │                       │
│  │ (Cloud)  │  │ (Cloud)  │  │ (Local)  │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Dependencies

**Backend:**

- `fastapi` - REST API framework
- `uvicorn` - ASGI server
- `httpx` - Async HTTP client for LLM APIs
- `python-pptx` - PPTX file manipulation
- `pydantic-settings` - Configuration management
- `langdetect` - Language detection

**Frontend:**

- `react` / `react-dom` - UI framework
- `vite` - Build tool
- `tailwindcss` - CSS framework

---

## 2. Functional Matrix & User Flows

### 2.1 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pptx/extract` | POST | Extract text blocks from PPTX |
| `/api/pptx/translate` | POST | Translate blocks using LLM |
| `/api/pptx/translate-stream` | POST | SSE streaming translation |
| `/api/pptx/apply` | POST | Apply translations to PPTX |
| `/api/pptx/languages` | POST | Detect document languages |
| `/api/pptx/extract-glossary` | POST | Extract glossary terms |
| `/api/tm/*` | CRUD | Translation Memory operations |
| `/api/llm/models` | GET | List available LLM models |
| `/api/llm/test-connection` | POST | Test LLM connectivity |
| `/api/export/*` | POST | Export to various formats |
| `/api/preserve-terms/*` | CRUD | Manage preserved terms |

### 2.2 Primary User Flow

```
┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│ 1. Upload    │───▶│ 2. Extract    │───▶│ 3. Review      │
│    PPTX      │    │    Blocks     │    │    Source      │
└──────────────┘    └───────────────┘    └────────────────┘
                                                  │
                                                  ▼
┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│ 6. Download  │◀───│ 5. Apply to   │◀───│ 4. Translate   │
│    Result    │    │    PPTX       │    │    (LLM)       │
└──────────────┘    └───────────────┘    └────────────────┘
```

### 2.3 Translation Pipeline

```python
# Pseudocode: Translation Flow
def translate_blocks(blocks, target_language, provider):
    # 1. Check Translation Memory
    for block in blocks:
        if hit := lookup_tm(block.source_text, target_language):
            block.translated_text = hit
            continue
        pending.append(block)

    # 2. Chunk pending blocks
    for chunk in chunked(pending, chunk_size):
        # 3. Check cache
        uncached = get_uncached_blocks(chunk)

        # 4. Dispatch to LLM provider
        if provider == "ollama":
            result = translate_ollama(uncached)
        else:
            result = translate_standard(uncached)

        # 5. Validate language
        if has_language_mismatch(result, target_language):
            result = retry_for_language(result)

        # 6. Cache results
        cache_results(result)

    return build_contract(blocks, translated_texts)
```

---

## 3. Data Schema

### 3.1 PPTXBlock Contract

```typescript
interface PPTXBlock {
    slide_index: number;      // 0-indexed slide number
    shape_id: number;         // Unique shape identifier
    block_type: "textbox" | "table_cell" | "notes";
    source_text: string;      // Original text
    translated_text: string;  // Translated text (default: "")
    client_id?: string;       // Optional client-side ID
    mode: "direct" | "bilingual" | "correction";
}
```

### 3.2 Translation Memory Schema (SQLite)

```sql
CREATE TABLE translation_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_lang TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_lang, target_lang, source_text)
);
```

### 3.3 Translation Cache Schema (SQLite)

```sql
CREATE TABLE translation_cache (
    source_text TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_text, target_lang, provider, model)
);
```

### 3.4 Configuration Schema

```python
class Settings(BaseSettings):
    # LLM Provider Selection
    llm_provider: str = "ollama"  # ollama | openai | gemini
    translate_llm_mode: str = "real"  # real | mock

    # Ollama
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "qwen2.5:7b"
    ollama_timeout: int = 180

    # OpenAI
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    # Gemini
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"

    # Performance
    llm_chunk_size: int = 40
    llm_max_retries: int = 2
    llm_fallback_on_error: bool = False
```

---

## 4. UI/UX Design Tokens

### 4.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#2563eb` | Primary buttons, links |
| `accent-strong` | `#1e3a8a` | Hover states |
| `accent-soft` | `#eff6ff` | Background highlights |
| `bg-primary` | `#ffffff` | Card backgrounds |
| `bg-secondary` | `#f8fafc` | Page background |
| `text-primary` | `#1e293b` | Main text |
| `text-secondary` | `#64748b` | Secondary text |

### 4.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Heading 1 | Inter | 32px | 700 |
| Heading 2 | Inter | 24px | 600 |
| Body | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |

### 4.3 Spacing & Radius

| Token | Value |
|-------|-------|
| `radius-lg` | 12px |
| `radius-xl` | 20px |
| `spacing-sm` | 8px |
| `spacing-md` | 16px |
| `spacing-lg` | 24px |

### 4.4 Component Library

| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | Sidebar.jsx | File upload, language selection |
| `BlockList` | BlockList.jsx | List of extracted blocks |
| `BlockCard` | BlockCard.jsx | Individual block display |
| `EditorPanel` | EditorPanel.jsx | Translation editing |
| `SettingsModal` | SettingsModal.jsx | LLM configuration |
| `ManageModal` | ManageModal.jsx | TM/Glossary management |
| `ExportMenu` | ExportMenu.jsx | Export options |
| `QualityBadge` | QualityBadge.jsx | Translation quality indicator |

---

## 5. Technical Logic

### 5.1 LLM Provider Selection

```python
def select_translator(provider, model, api_key, base_url):
    match provider.lower():
        case "openai":
            validate_api_key(api_key or settings.openai_api_key)
            return OpenAITranslator(api_key, model, base_url)
        case "gemini":
            validate_api_key(api_key or settings.gemini_api_key)
            return GeminiTranslator(api_key, model)
        case "ollama":
            return OllamaTranslator(base_url or settings.ollama_base_url, model)
        case _:
            raise ValueError(f"Unknown provider: {provider}")
```

### 5.2 Retry with Language Validation

```python
def retry_for_language(result, target_language, max_retries=2):
    for attempt in range(max_retries):
        texts = [block.translated_text for block in result.blocks]
        if not has_language_mismatch(texts, target_language):
            return result

        # Build strict retry context
        context = build_language_retry_context(target_language)
        result = translator.translate(blocks, context=context)

    raise ValueError(f"Language mismatch persists: {target_language}")
```

### 5.3 SSE Progress Streaming

```python
async def translate_stream(blocks, target_language, on_progress):
    queue = asyncio.Queue()

    async def progress_callback(data):
        await queue.put({"event": "progress", "data": data})

    task = asyncio.create_task(
        translate_blocks_async(blocks, on_progress=progress_callback)
    )

    while not task.done():
        try:
            event = await asyncio.wait_for(queue.get(), timeout=0.1)
            yield f"event: {event['event']}\ndata: {event['data']}\n\n"
        except asyncio.TimeoutError:
            continue

    result = await task
    yield f"event: complete\ndata: {json.dumps(result)}\n\n"
```

---

## 6. Deployment

### 6.1 Docker Compose

```yaml
services:
  backend:
    build: { dockerfile: Dockerfile.backend }
    ports: ["5001:5001"]
    environment:
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://ollama:11434
    volumes:
      - ./data:/app/data

  frontend:
    build: { dockerfile: Dockerfile.frontend }
    ports: ["5173:80"]
    depends_on: [backend]

  ollama:
    image: ollama/ollama
    ports: ["11434:11434"]
    volumes:
      - ollama_data:/root/.ollama
```

### 6.2 Environment Variables

See [.env.example](file:///Users/japlin.chenvpic1.com.vn/Downloads/PPTX-Translate/.env.example) for complete list.

---

*Generated: 2026-01-18*
