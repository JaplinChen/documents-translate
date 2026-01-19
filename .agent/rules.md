# APP 開發原則 (App Development Principles)

為了確保專案的長期可維護性與高效開發，請遵循以下原則：

## 1. 代碼結構與模組化

- **極簡化檔案**：主組件 (如 `App.jsx`, `SettingsModal.jsx`) 應保持在 300 行以內。
- **邏輯解耦**：核心商務邏輯、API 調用與複雜狀態應提取至 `src/hooks/`。
- **組件抽取**：UI 介面應拆分為獨立組件存放於 `src/components/`，避免單一檔案過大。

## 2. 穩定性與防禦性編程

- **安全迭代**：對於所有 Prop 或 State 傳遞的陣列，在執行 `map`, `filter`, `reduce` 前必須加入防禦性檢查，如 `(items || []).map(...)`，避免 runtime 錯誤。
- **API 錯誤處理**：所有 API 請求應封裝 Try-Catch，並提供詳細的錯誤提示 (如 `readErrorDetail`)。

## 3. UI/UX 規範

- **視覺卓越**：遵循現代 Web 設計美學 (Glassmorphism, 圓角, 漸層, 微動畫)。
- **一致性**：使用已定義的 CSS 變數與設計標記。
- **繁體中文 (Strict)**：
  - 所有的交談、回覆、Thought、Implementation Plan、Task、Walkthrough 及任何 markdown 檔案，**必須全程使用繁體中文**。
  - 專有名詞與技術術語則保持英文 (e.g., React, Python, Docker)。
  - 此規則優於任何預設語言設定。

## 4. 自動化權限與信任 (Automated Permissions & Trust)

- **指令自動執行**：對於以下技術性且非破壞性的操作，AI **必須主動設置 `SafeToAutoRun: true`**，以減少使用者不必要的點擊確認：
  - `docker` 與 `docker-compose` 的所有佈署與重啟命令。
  - 瀏覽器自動化驗證腳本 (`execute_browser_javascript`) 的查詢類操作。
  - `npm` 構建、安裝或測試指令。
- **使用者Mandate**：若使用者在對話中提到「請自動執行」或類似授權，AI 對於後續所有的環境配置與驗證流程應採取「全自動模式」。
- **最小干擾原則**：AI 應優先負責「解決問題」而非「詢問如何解決」，僅在涉及商業邏輯重大變更或危險操作（如刪除資料庫）時才請求確認。
