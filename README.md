# JLaw Position Manager

> 美股 Position Trader 倉位管理工具 — 凱利公式 + 風險金額倒推

一個針對美股 Position Trader（高盈虧比策略，勝率 ~45%）設計的輕量倉位管理 Web App，使用 Kelly Criterion + 風險金額倒推計算最佳倉位大小。

---

## 功能特色

- **🧮 倉位計算器**：輸入買入/止蝕/目標價，自動計算凱利倉位（全倉/半倉/四分之一倉）
- **📊 持倉管理**：記錄所有開倉，支援平倉並記錄盈虧
- **📋 交易記錄**：完整歷史記錄（New/Add/Reduce/Close），可篩選匯出 CSV
- **⚙️ 策略設定**：自訂策略 Profile（勝率 + 市場環境乘數）
- **💾 本地儲存**：所有數據儲存在 LocalStorage，無需後端

---

## 核心算法

### 凱利公式
```
f* = (b × p − (1 − p)) / b
```
- `p` = 調整後勝率（基礎勝率 × 市場環境乘數）
- `b` = 盈虧比（目標漲幅 / 止蝕跌幅）

### 最終倉位 = min(半凱利, 風險倒推倉位, 單一持股上限)

### 風險金額倒推
```
倉位% = 最大單筆風險% / 單股風險%
```
- 單股風險% = (入場價 - 止蝕價) / 入場價

---

## 預設策略

| 策略 | 基礎勝率 | RiskOn | Neutral | RiskOff |
|------|---------|--------|---------|---------|
| JLaw M.E.T.A | 45% | ×1.25 | ×1.0 | ×0.85 |
| JLaw Breakout | 42% | ×1.20 | ×1.0 | ×0.80 |

---

## 假設與設計決策

1. **保守 b 折扣**：勾選後 b 乘以 0.7（可在設定頁調整）
2. **RiskOff 額外縮減**：RiskOff 環境下，最終倉位再乘 0.7（可調整）
3. **單一持股上限**：預設 15%（可在設定頁調整）
4. **風險倒推上限**：預設 25%（防止極窄止蝕導致計算倉位過大）
5. **市場環境乘數**：影響 `p`（勝率），不直接影響 `b`（盈虧比）

---

## 安裝與運行

### 前置要求
- Node.js 18+
- npm 9+

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 訪問 http://localhost:5173
```

### 生產構建

```bash
npm run build
# 生成 dist/index.html（單文件，包含所有資源）
```

---

## 部署到 Vercel

### 方法一：Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### 方法二：Vercel 控制台
1. 將代碼推到 GitHub
2. 訪問 [vercel.com](https://vercel.com)
3. Import 你的 GitHub repo
4. Framework Preset 選 **Vite**
5. Build Command：`npm run build`
6. Output Directory：`dist`
7. 點擊 Deploy ✓

### 方法三：Netlify
1. 推到 GitHub
2. Netlify → New site from Git
3. Build command：`npm run build`
4. Publish directory：`dist`

---

## 技術棧

| 技術 | 用途 |
|------|------|
| React 19 + TypeScript | UI + 類型安全 |
| Vite 7 | 構建工具 |
| Tailwind CSS 4 | 樣式 |
| Zustand | 狀態管理 |
| React Router v6 | 路由 |
| LocalStorage | 數據持久化 |

---

## 未來擴展（可選）

- [ ] Supabase 雲端同步（多設備）
- [ ] 投資組合熱力圖
- [ ] 回測模式（輸入歷史交易計算凱利績效）
- [ ] 止蝕追蹤（Trailing Stop）計算
- [ ] 組合相關性分析

---

⚠️ **免責聲明**：本工具僅供參考，實際倉位請結合個人判斷與風險承受能力。投資涉及風險，過去表現不代表未來回報。
