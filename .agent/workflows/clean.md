---
description: 清理暫存檔案、編譯產出與 Log
---

# 清理工作區 (Clean Workspace)

此指令將執行清理腳本，移除以下項目：

1. Python `__pycache__` 與 `.pyc`
2. 前端編譯產出 (`frontend/dist`)
3. 舊的打包檔案 (`.zip`, `.spec`, `build/`, `dist/`)
4. 應用程式 Log 檔 (`*.log`)

## 執行步驟

```bash
# 執行 Python 清理腳本
python scripts/clean_workspace.py
```
