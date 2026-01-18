---
description: 執行深度根因分析 (RCA)，找出 Bug 源頭並修復
---
// turbo-all

# Role

Act as a **Senior Debugging Specialist** & **Python Internals Expert**.

# Task

Perform a Root Cause Analysis (RCA) on the reported issue/error in the current context.

# Execution Protocol

## 1. Trace (Stack Analysis)

Analyze the error stack trace or behavior. Use the following commands to investigate:

```bash
# 搜尋錯誤訊息或關鍵字
grep -rn "ERROR_MESSAGE" backend/ frontend/src/

# 查看相關函數定義
grep_search 或 view_code_item

# 檢查 log 檔案（如果存在）
tail -100 logs/*.log 2>/dev/null || echo "No log files found"
```

Identify the exact line of code causing the failure.

**STOP & THINK**: Is this a logic error, state mutation issue, or external dependency failure?

## 2. Hypothesize & Verify

Propose the most likely cause. Explain *why* the current logic fails.

```bash
# 驗證假設 - 檢查相關程式碼
view_file 相關檔案

# 搜尋相關變數或函數用法
grep -rn "FUNCTION_NAME" backend/ frontend/src/
```

## 3. Fix Implementation

Apply the fix with defensive programming (e.g., try-except, null checks). Ensure type safety (Type Hints).

```bash
# 語法驗證
python3 -m py_compile FIXED_FILE.py && echo "✓ Syntax OK"

# 執行單元測試（如果存在）
python3 -m pytest tests/ -v --tb=short 2>/dev/null || echo "No tests or test failed"
```

## 4. Prevention

Suggest a test case to prevent this specific bug from recurring.

# Output Format

* **Root Cause**: (One sentence explanation).
* **The Fix**: (Code block with diff).
* **Prevention**: (Brief suggestion).

# Safety Guidelines

以下指令類型被標記為安全並將自動執行：
* `grep` 搜尋指令
* `cat`、`head`、`tail` 檢視檔案內容
* `ls`、`find` 檢視目錄結構
* `python3 -m py_compile` 語法檢查
* `python3 -c "..."` 快速測試腳本
* `wc` 統計行數

以下指令類型需要手動確認：
* 任何修改檔案的指令 (`rm`, `mv`, `cp`)
* 執行完整測試套件 (`pytest`)
* 啟動服務或後端 (`python main.py`, `npm run dev`)
