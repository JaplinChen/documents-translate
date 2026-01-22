# 企業級 PPTX 翻譯與校正控制台

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-內部使用-lightgrey.svg)]()

> 內部文件翻譯工具，支援 PPTX 與 DOCX 格式

## 功能特色

- 🌐 **多語言支援**：自動偵測語言，支援中文（繁體/簡體）、越南語、英語、日語、韓語
- 🤖 **多 LLM 提供者**：Ollama（本機）、Gemini、OpenAI
- 📝 **翻譯記憶庫**：SQLite 儲存，支援術語表與翻譯記憶
- 🎨 **校正模式**：色彩標示校正內容
- 📄 **雙語輸出**：同時保留原文與譯文
- 🐳 **Docker 部署**：一鍵啟動前後端服務

---

## 示範

### 應用程式介面
![應用程式介面](docs/screenshots/app-interface.png)

### 翻譯過程
![翻譯過程](docs/screenshots/translation-process.png)

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

## 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發設定

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 程式碼規範

- 遵循 PEP 8 風格指南
- 使用型別提示
- 為新功能添加測試
- 更新相關文檔

---

## 技術文件

詳細技術規格請參閱 [TECH_SPEC.md](TECH_SPEC.md)

---

## 作者

- **VPIC1 Japlin Chen** - *初始開發與維護*

## 致謝

- 感謝所有貢獻者
- 特別感謝 OpenAI、Google Gemini 與 Ollama 團隊提供強大的 LLM 支援
- 使用 FastAPI、React 與其他開源工具

---

## 授權

內部使用
