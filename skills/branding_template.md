# Skill: [通用] 網站標誌與 SEO 全方位配置腳本

本腳本為任何 Web 專案建立標準的「身分識別」與「社群預覽」基準。

## 1. 靜態資源規範 (Standard Assets)
每個專案必須在 `public/` 目錄具備以下資產：
- `favicon.png`: (推薦 32x32 或 128x128) 網站分頁圖示。
- `favicon.svg`: (可選) 向量圖示，於縮放時保持清晰。
- `og-image.png`: (必須 1200x630) 社群預覽圖。**高級感建議：使用大量留白與精確排版。**

## 2. 萬用 HTML Meta 模板
將此區塊複製到 `index.html` 的 `<head>` 中：

```html
<!-- 基本 SEO -->
<title>[專案名稱] | [核心價值預留位]</title>
<meta name="description" content="[專案詳細描述]" />

<!-- Open Graph (FB, LINE) -->
<meta property="og:type" content="website" />
<meta property="og:title" content="[專案名稱]" />
<meta property="og:description" content="[描述]" />
<meta property="og:image" content="/og-image.png" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="/og-image.png" />
```

## 3. 部署檢查清單 (Checklist)
- [ ] 所有圖片是否已透過壓縮工具優化品質與體積？
- [ ] 預覽圖在黑暗與光明模式下是否皆可清晰辨識？
- [ ] meta 標籤中的 URL 是否指向最終部署之網址？

---
*Created by Antigravity AI - Domain General Template*
