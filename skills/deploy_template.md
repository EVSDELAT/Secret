# Skill: [通用] GitHub 版本控制與 Pages 部屬標準工作流

本腳本定義了開發任何前端專案（Vite, React, Vue）時的標準 Git 操作與自動化部署流程。

## 1. Git 版本控制規範 (Workflow)
遵循以下步驟進行日常變更管理：

```powershell
# A. 查看異動
git status

# B. 暫存變更
git add .

# C. 提交變更 (推薦格式: type: description)
# feat (新功能), fix (修復), docs (文件), style (樣式)
git commit -m "style: optimize visual assets and meta tags"

# D. 推送至遠端
git push origin [你的分支名稱, 如 main]
```

## 2. 自動化部屬 (GitHub Pages)
確保 `package.json` 中具備以下配置：

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

執行部署指令：
```powershell
npm run deploy
```

## 3. 風險避讓 (Pro-tips)
- **404 頁面**: 若使用 SPA 路由，建議在 `public/` 放入 `404.html`。
- **分支保護**: 建議僅在部署成功後才合併至 `main` 分支。
- **自定義網域**: 若有 CNAME 需求，請確保 `public/` 下有 `CNAME` 檔案。

---
*Created by Antigravity AI - Universal Deployment Guide*
