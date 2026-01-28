# 術語資料維護系統 PRD

## 1. 文件資訊
- 文件名稱：術語資料維護系統 PRD
- 版本：V1.0
- 狀態：草案
- 建立日期：2026-01-28
- 適用範圍：術語資料維護頁面（多人協作）

## 2. 背景與問題
目前術語維護頁僅提供單一術語欄位，缺乏多語內容與補充說明；分類無法新增或排序；缺少批次作業、版本追溯與匯入預覽，導致多人協作效率低、一致性不足、錯誤難以追查。

## 3. 目標與非目標
### 3.1 目標
- 提供可動態新增語言的術語維護能力
- 支援多人協作並保留版本紀錄與差異比對
- 提升批次處理與 CSV 匯入效率
- 強化搜尋與過濾，快速定位缺值或異常資料

### 3.2 非目標
- 權限控管與審核流程（本期不納入）
- 分類層級結構（本期不納入）

## 4. 使用者與情境
### 4.1 角色
- 編輯者：新增、編輯、批次操作、匯入/匯出
- 檢視者：搜尋、檢視、匯出

### 4.2 主要情境
- 新增術語並填寫多語內容、別名、說明
- 透過 CSV 批次匯入術語與語言內容
- 批次調整分類、狀態或大小寫規則
- 檢索缺少特定語言的術語
- 查看術語歷史版本與差異內容

## 5. 功能需求
### 5.1 術語管理（CRUD）
- 建立、編輯、刪除術語
- 欄位：術語、分類、狀態、大小寫規則、說明/備註
- 支援別名/同義詞（多筆）
- 文字正規化：trim、多空白合併
- 允許全大寫（依規則設定）

### 5.2 語言管理
- 可動態新增語言欄位
- 新增語言後，列表與表單即時可用
- 語言欄位可為空（支援缺值搜尋）

### 5.3 分類管理
- 新增、編輯、排序分類
- 分類無層級

### 5.4 搜尋與過濾
- 文字搜尋：術語、別名
- 過濾條件：語言缺值、分類、建立人、日期範圍、狀態、是否有別名

### 5.5 批次作業
- 批次變更分類
- 批次變更狀態
- 批次套用大小寫規則
- 批次刪除

### 5.6 CSV 匯入/匯出
- 固定欄位格式
- 匯入流程支援欄位映射與預覽
- 匯入結果回報成功/失敗與原因

### 5.7 版本紀錄與差異比對
- 每筆術語保存版本紀錄
- 支援欄位級別差異比對
- 顯示變更人與時間

## 6. 資料模型（概念）
### 6.1 Term
- id
- term
- category_id
- status
- case_rule
- note
- created_by
- created_at
- updated_at

### 6.2 TermLanguage
- id
- term_id
- lang_code
- value

### 6.3 TermAlias
- id
- term_id
- alias

### 6.4 Category
- id
- name
- sort_order

### 6.5 TermVersion
- id
- term_id
- diff
- created_by
- created_at

## 7. CSV 規格與驗證
### 7.1 固定欄位
- 必填：term、category、status
- 選填：aliases、note、case_rule、lang_zh-TW、lang_en、lang_ja（動態語言欄位）

### 7.2 驗證規則
- term 必填，不可重複（忽略大小寫與多空白）
- category 必填；不存在可在匯入流程選擇自動新增
- status 必填；限定值例如：active / inactive
- aliases 不可與其他 term 或 alias 重複
- case_rule 允許：preserve / uppercase / lowercase
- 文字正規化：trim、多空白合併

### 7.3 匯入流程
1) 上傳 CSV
2) 欄位映射
3) 資料預覽（含錯誤提示）
4) 確認匯入
5) 匯入結果報表（含可下載錯誤清單）

## 8. UI 與互動流程
### 8.1 列表頁
- 搜尋框 + 進階過濾
- 匯入/匯出按鈕
- 欄位顯示自訂（含語言欄位）
- 表格欄位：術語、分類、狀態、語言欄位、建立時間、操作
- 勾選後顯示批次操作條

### 8.2 新增/編輯
- 基本欄位區：術語、分類、狀態、大小寫規則
- 語言欄位區（動態）
- 別名/同義詞
- 說明/備註

### 8.3 版本紀錄
- 版本列表（時間/操作者）
- 差異比對視圖（欄位級別）

## 9. 非功能需求
- 匯入 1,000 筆內 30 秒完成
- 列表查詢 2 秒內回應
- 版本差異可讀性佳

## 10. 驗收標準
- CSV 匯入成功率 ≥ 98%，失敗可定位錯誤列
- 搜尋與過濾結果正確率 ≥ 99%
- 版本紀錄可正確還原所有欄位變更

## 11. 風險與對策
- 風險：動態語言欄位擴充造成欄位管理複雜
  - 對策：提供欄位顯示自訂與預設模板
- 風險：批次刪除誤操作
  - 對策：二次確認與可回復機制（版本還原）

## 12. 分期計畫
### Phase 1（MVP）
- 術語 CRUD + 分類管理
- 動態語言欄位
- CSV 匯入/匯出（含映射與預覽）
- 搜尋/過濾（含狀態與是否有別名）

### Phase 2（效率提升）
- 批次作業（分類、狀態、大小寫規則、刪除）
- 欄位顯示自訂與固定欄位

### Phase 3（治理與追溯）
- 版本紀錄與差異比對
- 重複術語/別名衝突提示

## 13. 流程圖文字版
### 13.1 新增/編輯術語流程
1) 使用者點擊「新增」或「編輯」
2) 填寫基本欄位（術語、分類、狀態、大小寫規則）
3) 填寫語言內容（動態語言欄位）
4) 填寫別名/同義詞與說明/備註
5) 系統執行正規化（trim、多空白合併）
6) 驗證通過 → 儲存 → 產生版本紀錄
7) 驗證失敗 → 顯示錯誤欄位與原因

### 13.2 CSV 匯入流程
1) 使用者上傳 CSV
2) 系統讀取欄位 → 進入欄位映射
3) 使用者完成映射 → 進入預覽
4) 系統顯示預覽與錯誤提示
5) 使用者確認匯入
6) 系統批次寫入 → 產生匯入結果報表
7) 匯入失敗列可下載錯誤清單

### 13.3 批次作業流程
1) 使用者勾選多筆術語
2) 點擊批次操作（分類/狀態/大小寫規則/刪除）
3) 系統顯示確認視窗
4) 使用者確認 → 系統執行 → 產生版本紀錄

### 13.4 版本差異比對流程
1) 使用者進入術語詳細或版本紀錄頁
2) 選擇兩個版本
3) 系統顯示欄位級別差異（高亮變更）

## 14. API 清單（建議）
### 14.1 術語
- GET /api/terms
  - 參數：q, category_id, status, has_alias, missing_lang, created_by, date_from, date_to, page, page_size
- POST /api/terms
- GET /api/terms/{id}
- PUT /api/terms/{id}
- DELETE /api/terms/{id}

### 14.2 語言內容
- GET /api/terms/{id}/languages
- PUT /api/terms/{id}/languages

### 14.3 別名
- GET /api/terms/{id}/aliases
- PUT /api/terms/{id}/aliases

### 14.4 分類
- GET /api/categories
- POST /api/categories
- PUT /api/categories/{id}
- DELETE /api/categories/{id}
- PUT /api/categories/sort

### 14.5 匯入/匯出
- POST /api/terms/import
  - 支援：欄位映射、預覽模式
- GET /api/terms/import/{id}/result
- GET /api/terms/export

### 14.6 批次作業
- POST /api/terms/batch
  - body: ids, action, payload

### 14.7 版本紀錄
- GET /api/terms/{id}/versions
- GET /api/terms/{id}/versions/{version_id}
- POST /api/terms/{id}/versions/compare

## 15. 欄位字典
### 15.1 Term
- id：術語唯一識別碼
- term：術語本體（正規化後儲存）
- category_id：分類 ID
- status：狀態（active / inactive）
- case_rule：大小寫規則（preserve / uppercase / lowercase）
- note：說明/備註
- created_by：建立者
- created_at：建立時間
- updated_at：更新時間

### 15.2 TermLanguage
- id：語言內容 ID
- term_id：術語 ID
- lang_code：語言代碼（如 zh-TW, en, ja）
- value：語言內容

### 15.3 TermAlias
- id：別名 ID
- term_id：術語 ID
- alias：別名內容

### 15.4 Category
- id：分類 ID
- name：分類名稱
- sort_order：排序值

### 15.5 TermVersion
- id：版本 ID
- term_id：術語 ID
- diff：差異內容（欄位級別）
- created_by：變更人
- created_at：變更時間

## 16. 欄位驗證規則表
### 16.1 Term
- term：必填；去除前後空白；多空白合併；不可與其他 term/alias 重複（忽略大小寫與空白）
- category_id：必填；需存在於分類表
- status：必填；限定 active / inactive
- case_rule：選填；限定 preserve / uppercase / lowercase；空值視為 preserve
- note：選填；長度 ≤ 1000

### 16.2 TermLanguage
- lang_code：必填；格式為 BCP-47（如 zh-TW、en）
- value：選填；長度 ≤ 2000

### 16.3 TermAlias
- alias：選填；不可與其他 term/alias 重複（忽略大小寫與空白）

### 16.4 Category
- name：必填；不可重複（忽略大小寫與空白）；長度 ≤ 100
- sort_order：必填；數值整數

### 16.5 CSV 匯入驗證
- term、category、status 必填
- 未知欄位禁止匯入
- 語言欄位必須符合 lang_ 前綴（如 lang_zh-TW）
- 別名以 | 分隔，單筆別名需通過 alias 規則

## 17. 錯誤碼規範
### 17.1 通用錯誤
- ERR-001：參數缺失
- ERR-002：參數格式錯誤
- ERR-003：權限不足
- ERR-004：資源不存在
- ERR-005：內部錯誤

### 17.2 術語相關
- TERM-001：術語重複
- TERM-002：術語不可為空
- TERM-003：大小寫規則不合法

### 17.3 分類相關
- CAT-001：分類不存在
- CAT-002：分類名稱重複

### 17.4 別名相關
- ALIAS-001：別名重複
- ALIAS-002：別名格式不合法

### 17.5 語言內容
- LANG-001：語言代碼不合法
- LANG-002：語言內容格式不合法

### 17.6 CSV 匯入
- CSV-001：欄位對應缺失
- CSV-002：欄位值格式錯誤
- CSV-003：資料重複
- CSV-004：未知欄位
- CSV-005：匯入失敗

## 17.7 錯誤碼對應 HTTP 狀態碼
- ERR-001：400 Bad Request
- ERR-002：400 Bad Request
- ERR-003：403 Forbidden
- ERR-004：404 Not Found
- ERR-005：500 Internal Server Error
- TERM-001：409 Conflict
- TERM-002：400 Bad Request
- TERM-003：400 Bad Request
- CAT-001：404 Not Found
- CAT-002：409 Conflict
- ALIAS-001：409 Conflict
- ALIAS-002：400 Bad Request
- LANG-001：400 Bad Request
- LANG-002：400 Bad Request
- CSV-001：400 Bad Request
- CSV-002：400 Bad Request
- CSV-003：409 Conflict
- CSV-004：400 Bad Request
- CSV-005：500 Internal Server Error

## 17.8 回應格式範例
### 17.8.1 成功回應
```json
{
  "success": true,
  "data": {
    "id": "t_123",
    "message": "ok"
  }
}
```

### 17.8.2 失敗回應（單一錯誤）
```json
{
  "success": false,
  "error": {
    "code": "TERM-001",
    "message": "術語重複",
    "details": {
      "field": "term",
      "value": "SSO"
    }
  }
}
```

### 17.8.3 失敗回應（多筆匯入錯誤）
```json
{
  "success": false,
  "error": {
    "code": "CSV-002",
    "message": "欄位值格式錯誤",
    "details": {
      "row_errors": [
        { "row": 2, "field": "status", "value": "enable", "reason": "不支援的狀態值" },
        { "row": 5, "field": "lang_zh-TW", "value": 123, "reason": "內容格式不合法" }
      ]
    }
  }
}
```

## 17.9 成功回應的分頁格式範例
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "t_123",
        "term": "SSO",
        "category_id": "c_10",
        "status": "active",
        "case_rule": "preserve",
        "created_at": "2026-01-28T10:12:00Z"
      }
    ],
    "page": 1,
    "page_size": 20,
    "total_items": 138,
    "total_pages": 7
  }
}
```

## 17.10 CSV 匯入結果報表格式
### 17.10.1 成功回應
```json
{
  "success": true,
  "data": {
    "import_id": "imp_20260128_001",
    "total_rows": 120,
    "success_rows": 118,
    "failed_rows": 2,
    "download_error_report": "https://example.com/imports/imp_20260128_001/errors.csv"
  }
}
```

### 17.10.2 失敗回應（含錯誤清單）
```json
{
  "success": false,
  "error": {
    "code": "CSV-002",
    "message": "欄位值格式錯誤",
    "details": {
      "import_id": "imp_20260128_001",
      "row_errors": [
        { "row": 2, "field": "status", "value": "enable", "reason": "不支援的狀態值" },
        { "row": 5, "field": "lang_zh-TW", "value": 123, "reason": "內容格式不合法" }
      ]
    }
  }
}
```

## 17.11 匯出 CSV 格式範例
```csv
term,category,status,case_rule,aliases,note,lang_zh-TW,lang_en,lang_ja
SSO,安全驗證,active,preserve,單一登入|單點登入,企業常用驗證,單一登入,Single Sign-On,
AI,專業術語,active,uppercase,,人工智慧相關,人工智慧,Artificial Intelligence,人工知能
```

## 18. API 參數明細表
### 18.1 GET /api/terms
- q：文字搜尋（術語/別名）
- category_id：分類 ID
- status：狀態
- has_alias：是否有別名（true/false）
- missing_lang：缺值語言代碼（如 zh-TW）
- created_by：建立者 ID
- date_from：起始日期（YYYY-MM-DD）
- date_to：結束日期（YYYY-MM-DD）
- page：頁碼
- page_size：每頁筆數

### 18.2 POST /api/terms
- term：術語
- category_id：分類 ID
- status：狀態
- case_rule：大小寫規則
- note：說明/備註
- languages：語言內容陣列
- aliases：別名陣列

### 18.3 PUT /api/terms/{id}
- term：術語
- category_id：分類 ID
- status：狀態
- case_rule：大小寫規則
- note：說明/備註
- languages：語言內容陣列
- aliases：別名陣列

### 18.4 POST /api/terms/import
- file：CSV 檔案
- mapping：欄位映射設定
- preview：是否僅預覽（true/false）

### 18.5 POST /api/terms/batch
- ids：術語 ID 陣列
- action：batch action（set_category / set_status / set_case_rule / delete）
- payload：對應 action 的內容

### 18.6 POST /api/terms/{id}/versions/compare
- version_id_a：版本 A
- version_id_b：版本 B

## 19. API Request/Response 範例
### 19.1 建立術語
**Request**
```json
{
  "term": "SSO",
  "category_id": "c_10",
  "status": "active",
  "case_rule": "preserve",
  "note": "企業常用驗證",
  "languages": [
    { "lang_code": "zh-TW", "value": "單一登入" },
    { "lang_code": "en", "value": "Single Sign-On" }
  ],
  "aliases": ["單點登入", "單一簽入"]
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "t_123",
    "message": "created"
  }
}
```

### 19.2 取得術語列表
**Request**
```
GET /api/terms?q=SSO&status=active&page=1&page_size=20
```

**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "t_123",
        "term": "SSO",
        "category_id": "c_10",
        "status": "active",
        "case_rule": "preserve",
        "languages": [
          { "lang_code": "zh-TW", "value": "單一登入" },
          { "lang_code": "en", "value": "Single Sign-On" }
        ],
        "aliases": ["單點登入"],
        "updated_at": "2026-01-28T10:12:00Z"
      }
    ],
    "page": 1,
    "page_size": 20,
    "total_items": 138,
    "total_pages": 7
  }
}
```

### 19.3 批次更新狀態
**Request**
```json
{
  "ids": ["t_123", "t_456"],
  "action": "set_status",
  "payload": { "status": "inactive" }
}
```

**Response**
```json
{
  "success": true,
  "data": { "updated": 2 }
}
```

### 19.4 版本差異比對
**Request**
```json
{
  "version_id_a": "v_001",
  "version_id_b": "v_003"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "diff": [
      { "field": "note", "from": "企業常用驗證", "to": "企業 SSO" },
      { "field": "languages.en", "from": "Single Sign-On", "to": "SSO" }
    ]
  }
}
```

## 20. 匯入欄位映射設定範例
```json
{
  "mapping": {
    "A": "term",
    "B": "category",
    "C": "status",
    "D": "case_rule",
    "E": "aliases",
    "F": "note",
    "G": "lang_zh-TW",
    "H": "lang_en",
    "I": "lang_ja"
  }
}
```

## 21. 版本差異顯示規格
- 欄位級別比對：每個欄位顯示 from/to
- 差異強調：新增以綠色標示、刪除以紅色標示、變更以黃底標示
- 多語欄位：以 languages.<lang_code> 呈現
- 別名欄位：顯示新增/刪除清單
- 支援匯出差異（JSON/CSV）

## 22. CSV 欄位型別與長度限制表
- term：string，1–200
- category：string，1–100
- status：enum（active/inactive）
- case_rule：enum（preserve/uppercase/lowercase）
- aliases：string，多筆以 | 分隔，單筆 1–200
- note：string，0–1000
- lang_*：string，0–2000

## 23. 進階搜尋與排序規格
- 支援排序欄位：term、category、status、created_at、updated_at
- 支援排序方向：asc/desc
- 搜尋比對規則：忽略大小寫、忽略多空白

## 24. 匯入預覽規格
- 顯示前 20 筆預覽
- 標示錯誤列與錯誤欄位
- 統計：總筆數、可匯入筆數、錯誤筆數
- 支援下載錯誤清單（CSV）

## 25. 匯出規格
- 匯出欄位依目前欄位顯示設定
- 可選擇是否包含別名與備註
- 檔名格式：terms_export_YYYYMMDD.csv

## 26. 狀態與行為定義
- active：可被搜尋與匯出，預設顯示
- inactive：預設不顯示（需勾選過濾條件）

## 27. 動態語言管理規格
- 新增語言需提供：語言代碼、顯示名稱
- 新增後立即出現在列表與表單
- 不允許刪除已被使用的語言（需先清空內容）

## 28. 列表狀態與空狀態
- 無資料：顯示空狀態文案與建立入口
- 搜尋無結果：提示調整條件並提供清除過濾
- 匯入失敗：顯示錯誤摘要與重試入口

## 29. 稽核與日誌（版本紀錄補充）
- 任何新增/編輯/批次作業皆產生版本紀錄
- 版本紀錄包含操作者、時間與差異內容

## 30. API 回應格式統一規範
- 成功：success=true + data
- 失敗：success=false + error { code, message, details }
- 分頁：data.items + page/page_size/total_items/total_pages

## 31. 安全與穩定性要求
- 匯入檔案大小上限：10MB
- 單次匯入最大筆數：5,000
- 匯入作業需可追蹤狀態（processing/success/failed）

## 32. 需求外但建議留白
- 角色權限與審核流程預留欄位
- 分類層級與標籤系統預留擴充空間
