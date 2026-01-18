# 命令自動執行偏好 (Auto-Run Commands)

對於以下類型的命令，請設定 `SafeToAutoRun: true`，無需詢問確認：

**Docker 相關：**

- docker compose up/down/restart/logs/ps/build
- docker logs/ps/exec
- docker-compose up -d --build
- docker-compose up -d --force-recreate
- docker-compose down
- docker-compose down -v
- docker-compose down --volumes
- docker-compose down --remove-orphans
- docker-compose down --remove-orphans --volumes

**讀取類命令：**

- cat、ls、grep、find、head、tail、wc
- git status/log/diff/branch

**這是開發環境，以上命令可以安全自動執行，無需手動 Accept。**
