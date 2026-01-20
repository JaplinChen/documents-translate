# 專案後續優化建議 (Improvement Proposals)

目前專案已完成基礎架構、多語系、Glassmorphism UI 以及非同步處理。為了讓專案更接近生產級別 (Production-Ready) 並提升使用者體驗，以下是建議的優化方向：

## 1. 核心效能與穩定性 (Performance & Stability)

* **翻譯快取機制 (Result Caching)**:
  * **現狀**: 同樣的 PPTX 重複翻譯會消耗大量 Token。
  * **建議**: 實作基於 `hash(原文內容 + 提示詞參數)` 的快取系統 (例如 Redis 或 SQLite)，同內容不再重複請求 LLM。
* **斷點續傳 (Resumable Translation)**:
  * **建議**: 在長篇 PPTX 翻譯過程中，如果網路中斷或 API 報錯，支援從上次中斷的區塊繼續，而非從頭開始。
* **後端任務隊列 (Worker Queue)**:
  * **建議**: 目前使用 FastAPI `async` 處理，雖然非同步但長連線 (SSE) 在大量併發時可能不穩。建議改用 `Celery` + `Redis` 處理背景任務。

## 2. AI 與翻譯品質 (AI & Quality)

* **多階段校正 (Multi-stage Refinement)**:
  * **建議**: 實作「初譯 -> 術語對齊 -> 語法潤色」的三階段 Flow，由不同 Model (如 Flash 做初譯，Pro 做潤色) 協作。
* **視覺內容輔助 (Multi-modal Support)**:
  * **建議**: 利用 Gemini 視圖功能，上傳投影片截圖給 AI，讓 AI 參考佈局資訊 (Layout context) 來決定標題與本文的語氣差異。
* **動態術語表 (Smart Glossary Extraction)**:
  * **現狀**: 目前由使用者手動維護。
  * **建議**: 翻譯前先由 AI 掃描整份文件，自動選出關鍵字並詢問使用者偏好譯名。

## 3. 使用者介面 (UI/UX)

* **即時預覽 (Live PPTX Preview)**:
  * **建議**: 在 Editor 旁邊顯示投影片縮圖，點擊 Block 時自動高亮對應的投影片位置。
* **批次操作 (Batch Actions)**:
  * **建議**: 增加「全選」、「搜尋與取代 (Regex)」、「強制套用術語」等批次編輯工具。
* **多格式支援延伸**:
  * **建議**: 目前已有 PPTX，可延伸至 PDF (PDF-to-PPTX-Translate) 或 Word / Excel。

## 4. PPTX 品質專項優化 (PPTX Specific Quality)

* **字體自動縮放 (Auto-FontSize Scaling)**:
  * **問題**: 翻譯後的文字 (如德文或中文) 往往比英文長，會超出文字框。
  * **建議**: 在寫回 PPTX 時，偵測文字框邊界，若溢出則自動等比例縮小字號 (Shrink text on overflow)。
* **格式精確繼承 (Rich Text Preservation)**:
  * **建議**: 目前可能僅套用單一格式。應精確解析原始 Run 級別的格式 (Font, Color, Bold, Italic)，並在翻譯後的標籤對應位置恢復這些樣式。
* **語義分段優化 (Semantic Line Breaks)**:
  * **建議**: 針對 CJK 語系，優化換行邏輯。避免在單字中間換行，並根據標點符號調整展示美感。
* **圖片內文字辨識與翻譯 (Image OCR & Translation)**:
  * **建議**: 若投影片內含有圖片文字，利用 Vision API 辨識其座標與內容，並在其上方覆蓋透明/半透明的翻譯文字框。
* **佈局智慧調整 (Smart Layout Refinement)**:
  * **建議**: 雙語模式下，如果左右排版導致文字過於擁擠，自動將「左右版面」切換為「上下疊放」，並動態調整圖片位置。

## 5. 運維與部署 (Ops)

* **Docker 部署優化**:
  * **建議**: 目前前端是開發環境，應實作 `Nginx` 託管靜態文件的二階段編譯 (Multi-stage build) 鏡像。
* **API 金鑰池 (Key Rotation)**:
  * **建議**: 支援設置多個 API Key，當其中一個達到 Limit 時自動切換。

---
> [!TIP]
> 如果您對以上任一項感興趣，我可以為您擬定詳細的實作計畫。
