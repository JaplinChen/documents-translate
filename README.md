# 企業級 PPTX 翻譯與校正控制台

> 內部文件翻譯工具，支援 PPTX 與 DOCX 格式

## 功能特色

- 🌐 **多語言支援**：自動偵測語言，支援中文（繁體/簡體）、越南語、英語、日語、韓語
- 🤖 **多 LLM 提供者**：Ollama（本機）、Gemini、OpenAI
- 📝 **翻譯記憶庫**：SQLite 儲存，支援術語表與翻譯記憶
- 🎨 **校正模式**：色彩標示校正內容
- 📄 **雙語輸出**：同時保留原文與譯文
- 🐳 **Docker 部署**：一鍵啟動前後端服務

---

## 快速開始

### 方式一：Docker 部署（推薦）

```bash
# 1. 啟動 Ollama（如需本機 LLM）
OLLAMA_HOST=0.0.0.0 ollama serve

# 2. 一鍵啟動
./start_docker.sh

# 或手動啟動
docker compose up -d --build
```

**存取位置**：

- 前端：<http://localhost:5193>
- 後端 API：<http://localhost:5001>
- API 文件：<http://localhost:5001/docs>

---

### 方式二：本機開發

**後端**

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 5001
```

**前端**

```bash
cd frontend
npm install
npm run dev
```

---

## 環境變數設定

複製 `.env.example` 並填入設定：

```bash
# Server
PORT=5001

# LLM Providers
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
GEMINI_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key

# Translation
TRANSLATE_LLM_MODE=real    # real | mock
LLM_CHUNK_SIZE=40
LLM_MAX_RETRIES=2
```

---

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/pptx/extract` | POST | 抽取 PPTX 文字區塊 |
| `/api/pptx/languages` | POST | 偵測文件語言 |
| `/api/pptx/translate` | POST | 翻譯文字區塊 |
| `/api/pptx/apply` | POST | 套用翻譯並生成新檔案 |
| `/api/llm/models` | POST | 取得 LLM 模型清單 |
| `/api/tm/glossary` | GET/POST | 術語表管理 |
| `/api/tm/entries` | GET/POST | 翻譯記憶管理 |
| `/health` | GET | 健康檢查（Docker 用） |

---

## 專案結構

```
PPTX-Translate/
├── backend/
│   ├── api/           # FastAPI 路由
│   ├── services/      # 業務邏輯
│   └── prompts/       # LLM 提示詞模板
├── frontend/
│   └── src/           # React 前端
├── docs/              # 合約檔案
├── data/              # 運行時資料
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
└── TECH_SPEC.md       # 完整技術規格
```

---

## 翻譯記憶庫

- **資料庫**：`data/translation_memory.db`（SQLite）
- **術語表**：優先套用，確保一致性
- **翻譯記憶**：自動快取已翻譯內容

**CSV 匯入格式**：

```csv
source_lang,target_lang,source_text,target_text,priority
```

---

## 限制說明

- 複雜排版與混合字型可能被簡化
- 雙語模式可能讓版面略為重新流動
- 校正樣式以整個圖形為單位
- 不支援圖片文字辨識（OCR）
- 不支援動畫與轉場

---

## 技術文件

詳細技術規格請參閱 [TECH_SPEC.md](TECH_SPEC.md)

---

## 授權

內部使用
