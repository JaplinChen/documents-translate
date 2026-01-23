# 任務：文件視覺風格分析與建議
請分析以下文件內容的產業屬性、主題語氣與結構特徵，並建議一套適合的 UI/文件視覺主題。

## 建議要求
- **配色方案**：提供主色 (Primary)、輔色 (Secondary) 與強調色 (Accent) 的 Hex 碼。
- **字體建議**：推薦一款最能體現該文件風格的現代字體（如 Inter, Roboto, Playfair Display 等）。
- **設計理念**：簡述為何這些配色與字體適合該文件內容。

## 輸出結構規範
輸出必須且僅能是一個 JSON 物件，包含以下鍵值：
"theme_name", "primary_color", "secondary_color", "accent_color", "font_recommendation", "rationale"。

## 待分析內容
{context}