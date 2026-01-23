# 任務指令
請將提供的 JSON `payload` 中每個文字區塊翻譯為目標語言 {target_language_label}。

## 核心翻譯準則
1. **術語優先**：若提供 `preferred_terms`（術語表），必須「嚴格優先」使用其中的翻譯，確保全文件一致。
2. **占位符保護**：若原文含 `placeholder_tokens`，必須完整保留至翻譯結果中，不可改動其語法結構。
3. **情境遵從**：若提供 `context`（如幻燈片標題、備註），請利用這些背景資訊來更精準地抓取語意，但無需翻譯 Context。
4. **表格一致性**：表格內容翻譯時，請確保結構對位，同列同行的術語應維持高度對稱與統一。

## 輸出規範
- 只輸出 JSON 數據，不包含任何額外說明文字。
- 翻譯內容請符合當地的商務/專業對話習慣（Tone & Style）。

## 參數與數據
- 目標語言：{target_language_label} ({target_language_code})
- 輔助提示：{language_hint}

{payload}