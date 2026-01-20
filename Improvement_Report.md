# 全專案程式碼審查與改善建議報告 (Code Audit & Improvement Report)

本報告針對 `PPTX-translate` 專案進行全面的架構與代碼審查，並依據 SOLID 原則與現代化開發最佳實務提出改善建議。

## 1. 架構總評 (High-Level Architecture)

專案採用典型的 **FastAPI (Backend) + React/Vite (Frontend)** 分離架構，並透過 Docker Compose 進行容器化部署。整體結構清晰，服務層 (`backend/services`) 職責劃分明確。

### 綜合評分: A-
- **優點**: 模組化程度高、有單元測試覆蓋、核心翻譯邏輯具備重試與快取機制。
- **改進點**: 前端狀態管理過於集中、後端部分 Utility 類別日益龐大。

---

## 2. 後端改善建議 (Backend - Python/FastAPI)

### 2.1 程式碼重構 (Refactoring)
- **`backend/services/pptx_apply_text.py` 過於龐大**:
  - 此檔案目前混合了「字體處理」、「段落樣式」、「CJK 排版優化 (Kinsoku)」與「文字寫入」邏輯。
  - **建議**: 拆分出 `backend/services/font_manager.py` 專責處理字體對應 (`FONT_MAPPING`, `clone_font_props`) 與縮放計算 (`estimate_scale`)。
- **`pptx_apply_core.py` 依賴反向**:
  - `pptx_apply` 依賴 `core`，但 `core` 又依賴 `layout` 和 `text`。隨著功能增加 (如 Phase 2 Preview)，建議建立 `PresentationContext` 物件來傳遞全域設定 (Theme, Font Map)，而非在每個函數間傳遞大量參數。

### 2.2 強健性與安全性
- **錯誤處理**:
  - 目前 API 層 (`backend/api/pptx.py`) 對 `json.JSONDecodeError` 處理良好，但在 Service 層 (如 `llm_client_openai.py`) 網路請求失敗時，雖然有 retry，但缺乏統一的錯誤代碼 (Error Code) 回傳給前端，前端僅能顯示 "Error"。
  - **建議**: 引入自定義 Exception 繼承體系，例如 `TranslationServiceError`, `QuotaExceededError`。

### 2.3 效能優化
- **`regex` 編譯**:
  - 在 `pptx_apply_text.py` 的 `apply_cjk_line_breaking` 中，`re.sub` 每次呼叫都會重新編譯 regex。
  - **建議**: 將 `re.compile(r'([\u4e00-\u9fff...])')` 移至模組全域變數 (Global Constant)。

---

## 3. 前端改善建議 (Frontend - React)

### 3.1 狀態管理 (State Management)
- **`App.jsx` 狀態過度集中 (God Component)**:
  - `App.jsx` 目前管理了從 `file` 物件到 `correction` 細部顏色設定等近 30 個 useState。
  - **建議**: 引入 **React Context** 或 **Zustand**。
    - `CorrectionContext`: 管理 `fillColor`, `textColor`, `lineColor`。
    - `ProjectContext`: 管理 `file`, `blocks`, `languages`。
  - **好處**: 減少 Props Drilling (層層傳遞 props)，提升渲染效能。

### 3.2 程式碼重複與硬編碼
- **Regex 重複**:
  - `App.jsx` 中的 `extractLanguageLines` 與後端 `language_detect.py` 存在類似的 CJK/Vietnamese Regex 邏輯。
  - **建議**: 前端應建立 `src/utils/regex.js` 統一管理正規表達式。

### 3.3 效能
- **`SettingsModal` 重繪**:
  - `SettingsModal` 包含多個 Tab，且依賴大量 Props。建議使用 `React.memo` 或將 Tab 內容拆分為獨立組件 (`Lazy Loading`)，避免開啟設定時卡頓。

---

## 4. DevOps 與測試

### 4.1 測試覆蓋率
- 目前測試集中在 `tests/`，主要針對後端。
- **建議**: 前端缺乏單元測試 (`Vitest`/`Jest`)。對於 `useLlmSettings` 這裡的邏輯 hooks，應補上測試以防白畫面回歸。

### 4.2 Docker 優化
- **Healthcheck**:
  - `Dockerfile` 未定義 `HEALTHCHECK` 指令。建議在 Dockerfile 中加入 `curl -f http://localhost:8000/health || exit 1` 以利自動重啟。

---

## 5. 立即執行計畫 (Action Plan)

若您同意，建議優先執行以下低成本高回報的改進：

1.  **[Backend] Regex 優化**: 將 `pptx_apply_text.py` 的 Regex 編譯全域化。
2.  **[Backend] 拆分 Font Manager**: 建立 `font_manager.py`。
3.  **[Frontend] 建立 Regex Utils**: 統一管理語言偵測 Regex。

這將立即使程式碼更整潔且效能更好。
