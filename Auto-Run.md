# 命令自動執行偏好 (Auto-Run Commands)

對於以下類型的命令，請設定 `SafeToAutoRun: true`，無需詢問確認：

**Docker 相關：**

- docker compose up/down/restart/logs/ps/build
- docker logs/ps/exec
- docker-compose up/down/restart/logs/ps/build
- docker-compose up -d --build
- npm test 2>&1

**讀取類命令：**

- cat、ls、grep、find、head、tail、wc
- git status/log/diff/branch
- python
- dir

**這是開發環境，以上命令可以安全自動執行，無需手動 Accept。**

**自動化規則：**

- 每次代碼修正或功能變更後，應自動執行 `/deploy` 工作流程。
- 該工作流程包含 `// turbo-all`，將自動接受所有 Docker 相關指令。
