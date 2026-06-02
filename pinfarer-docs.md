# Pinfarer — Product Requirements & Task Breakdown

> 旅行地图 + AI Agent · Portfolio Project · Full-stack (Next.js + Supabase + Claude API)

---

## Part 1 · 需求文档 (PRD)

### 1.1 项目概述

**项目名称:** Pinfarer  
**定位:** 个人旅行地图 + AI 行程规划 Agent，兼顾求职 portfolio 展示与日常使用  
**目标用户:** 开发者本人（SW）+ 面试官（旅行相关公司）  
**核心差异点:** 区分"已去过"与"看视频/文章发现想去"的地点，结合 Claude AI 做智能行程规划

---

### 1.2 核心功能

#### F1 · 地图主页
- 基于 Mapbox GL JS 的交互式世界地图（深色主题）
- 三状态 Pin 系统：
  - 🟢 **Visited** — 本人到访过
  - 🟡 **Watchlist** — 看视频/文章/书后标记
  - 🔵 **Dream** — 收藏但无具体计划
- 点击 Pin 进入地点详情页
- 侧边栏列表：搜索、筛选、按状态分类
- 底部实时统计：国家数 / Pin 总数

#### F2 · 地点详情页
- 地点基本信息（名称、国家、坐标、大洲）
- 来源类型标注（YouTube / 公众号 / 小红书 / 书籍 / 自己探索 / Unknown）
- 来源链接（`source_url`，可选）：填频道或视频 URL，点击直接跳转；不记得可留空
- 个人备注（自由文本）
- AI 自动生成介绍（调用 Claude API，一键生成）
- 周边相关地点推荐（同国家/地区的其他 Pin）

#### F3 · Dashboard 统计页
- KPI 卡片：已访问 / Watchlist / Dream / 国家总数
- 地区分布柱状图（East Asia / Europe / SE Asia 等）
- 内容来源分析（YouTube / 公众号 / 书籍 / Unknown 占比）
- AI 推荐卡（Claude API：基于 Watchlist 模式推荐下一个目的地，附理由）

#### F4 · AI Travel Agent
- 右侧对话面板 + 左侧地图联动
- 用户输入自然语言需求（天数、预算、偏好、出发地）
- Agent 读取用户 Watchlist 数据，结合 Claude API 生成行程
- 行程以结构化卡片展示（城市 / 天数 / 亮点 / Google Places 评分）
- 地图自动画出路线连线（Turf.js 大圆弧）
- 支持多轮对话修改（移除城市、调整天数、换目的地）
- 快捷 Suggestion chips（一键触发常见需求）

#### F5 · Google Maps 数据导入
- 上传 Google Takeout 导出的 KML 文件
- 自动解析地点名称 + 坐标
- 批量设置默认来源类型
- 导入前预览表格（支持逐条修改状态）
- 导入后自动显示在地图上

---

### 1.3 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | Next.js 14 (App Router) | 全栈，省去单独后端 |
| 地图 | Mapbox GL JS | 交互地图，免费额度够用 |
| 路线计算 | Turf.js | 大圆弧计算，不需要后端 |
| 样式 | Tailwind CSS | 快速开发 |
| 数据库 | Supabase (PostgreSQL) | 免费 hosted，含 Auth |
| AI | Claude API (claude-sonnet-4-5) | 行程规划 + 地点介绍生成 |
| 地点评分 | Google Places API | 实时评分，免费额度充足 |
| 部署 | Vercel | Next.js 原生支持，免费 |
| 版本控制 | GitHub | CI/CD 自动部署 |

---

### 1.4 设计系统

#### 配色方案（Airbnb-inspired · 定案）

> 参考 Airbnb 暖色系，针对地图产品做了调整：纯白换沙米色，深灰加蓝调配合地图背景。  
> 开发时可运行 `npx getdesign@latest add airbnb` 获取 Airbnb DESIGN.md 作为 AI 编码参考。

**Base surfaces**

| Token | Hex | 用途 |
|-------|-----|------|
| `--sand` | `#F5F0E8` | 主背景 |
| `--cream` | `#FFF8EF` | 卡片、侧边栏背景 |
| `--ink` | `#1A1A2E` | 导航栏、正文、按钮 |
| `--deep-ocean` | `#0d1b2a` | 地图背景 |

**Brand accent**

| Token | Hex | 用途 |
|-------|-----|------|
| `--coral` | `#E76F51` | 主 CTA、Logo 强调色（参考 Airbnb `#FF5A5F`，稍暖） |
| `--gold` | `#F4A261` | 数据高亮、统计数字 |
| `--forest` | `#2D6A4F` | Import 按钮、成功状态 |

**Pin 三状态颜色（核心）**

| 状态 | Token | Hex | 含义 |
|------|-------|-----|------|
| ✓ Visited | `--mint` | `#52B788` | 本人到访过 |
| 👁 Watchlist | `--amber` | `#F4A261` | 看视频/文章后标记 |
| ✨ Dream | `--lavender` | `#9B89C4` | 收藏但无具体计划 |

**Muted / secondary**

| Token | Hex | 用途 |
|-------|-----|------|
| `--muted` | `#8A8578` | 次要文字、metadata |

#### 字体

| 用途 | 字体 | 样式 |
|------|------|------|
| 标题、Logo、行程卡片 | Fraunces | Serif，支持 italic |
| 导航、标签、正文 | DM Sans | Sans-serif，weight 400/500 |

```css
/* globals.css */
:root {
  /* Surfaces */
  --sand:       #F5F0E8;
  --cream:      #FFF8EF;
  --ink:        #1A1A2E;
  --deep-ocean: #0d1b2a;
  --muted:      #8A8578;

  /* Brand */
  --coral:      #E76F51;
  --gold:       #F4A261;
  --forest:     #2D6A4F;

  /* Pin status */
  --mint:       #52B788;   /* Visited  */
  --amber:      #F4A261;   /* Watchlist */
  --lavender:   #9B89C4;   /* Dream    */
}
```

#### 设计参考来源

- **Airbnb** — 整体色调、圆角卡片、暖色背景
- **Mapbox Dark** — 地图区域深色底
- **Notion** — 备注/文本区排版参考

---

### 1.5 数据模型

```sql
-- 地点表
CREATE TABLE pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users,
  name        TEXT NOT NULL,
  country     TEXT,
  region      TEXT,
  lat         DECIMAL(9,6),
  lng         DECIMAL(9,6),
  status      TEXT CHECK (status IN ('visited', 'watchlist', 'dream')),
  source      TEXT CHECK (source IN ('youtube', 'wechat', 'xiaohongshu', 'book', 'self', 'unknown')),
  source_url  TEXT,          -- 可选：YouTube 频道/视频链接，点击跳转
  notes       TEXT,
  ai_summary  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 行程表（Agent 生成）
CREATE TABLE itineraries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users,
  title       TEXT,
  days        INTEGER,
  route       JSONB,   -- [{city, country, lat, lng, days, notes}]
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### 1.6 页面结构

```
/                   → 地图主页 (F1)
/place/[id]         → 地点详情 (F2)
/dashboard          → 统计页 (F3)
/agent              → AI Travel Agent (F4)
/import             → 数据导入 (F5)
```

---

### 1.7 非功能需求

- 响应式：桌面优先，移动端可浏览
- 首屏加载 < 3s（Mapbox 懒加载）
- Claude API 调用做 loading 状态，超时 30s 提示
- Supabase RLS 保护用户数据隔离
- 环境变量管理 API keys，不暴露在前端

---

## Part 2 · Ticket 任务拆解

> 优先级：🔴 P0 必做 · 🟡 P1 重要 · 🟢 P2 加分项  
> 预估工作量：S=半天 M=1天 L=2天

---

### Epic 1 · 项目初始化

| ID | Ticket | 优先级 | 工作量 |
|----|--------|--------|--------|
| E1-01 | 创建 Next.js 14 项目，配置 Tailwind CSS | 🔴 P0 | S |
| E1-02 | 创建 GitHub 仓库，配置 .gitignore，连接 Vercel | 🔴 P0 | S |
| E1-03 | 配置 Supabase 项目，创建 pins / itineraries 表，开启 RLS | 🔴 P0 | S |
| E1-04 | 配置环境变量（MAPBOX_TOKEN / CLAUDE_API_KEY / SUPABASE_URL 等） | 🔴 P0 | S |
| E1-05 | 配置全局 CSS 变量（颜色 tokens 见 1.4 设计系统）+ 引入 Fraunces / DM Sans 字体 | 🔴 P0 | S |

---

### Epic 2 · 地图主页 (F1)

| ID | Ticket | 优先级 | 工作量 |
|----|--------|--------|--------|
| E2-01 | 集成 Mapbox GL JS，渲染深色主题世界地图 | 🔴 P0 | M |
| E2-02 | 从 Supabase 读取 pins 数据，在地图上渲染三色 Pin | 🔴 P0 | M |
| E2-03 | Pin 点击事件：跳转到 /place/[id] | 🔴 P0 | S |
| E2-04 | 右侧侧边栏：Pin 列表展示，含状态 badge | 🔴 P0 | M |
| E2-05 | 侧边栏搜索框：按地点名称实时筛选 | 🟡 P1 | S |
| E2-06 | 顶部 Filter chips：按 Visited / Watchlist / Dream 筛选地图 Pin | 🟡 P1 | S |
| E2-07 | 底部统计条：国家数 / Pin 总数实时计算 | 🟡 P1 | S |
| E2-08 | Pin hover tooltip：显示地点名 + 状态 | 🟡 P1 | S |

---

### Epic 3 · 地点详情页 (F2)

| ID | Ticket | 优先级 | 工作量 |
|----|--------|--------|--------|
| E3-01 | 详情页布局：hero 区 + 基本信息 grid | 🔴 P0 | M |
| E3-02 | 来源类型 chip 展示（YouTube / 公众号 / 书籍 / Unknown） | 🔴 P0 | S |
| E3-03 | 来源链接（source_url）：展示频道名 + 跳转链接，留空时不显示 | 🔴 P0 | S |
| E3-04 | 个人备注：展示 + 行内编辑 + 保存到 Supabase | 🟡 P1 | M |
| E3-05 | AI 自动生成介绍按钮：调用 Claude API，存入 ai_summary 字段 | 🟡 P1 | M |
| E3-06 | 周边地点推荐：查同 country 的其他 pins，展示最多 3 个 | 🟡 P1 | S |
| E3-07 | 状态切换：在详情页可修改 Visited / Watchlist / Dream | 🟡 P1 | S |

---

### Epic 4 · Dashboard 统计页 (F3)

| ID | Ticket | 优先级 | 工作量 |
|----|--------|--------|--------|
| E4-01 | KPI 卡片：Visited / Watchlist / Dream / 国家数 | 🔴 P0 | S |
| E4-02 | 地区分布柱状图（用 Recharts 或纯 CSS） | 🟡 P1 | M |
| E4-03 | 来源类型分布图（YouTube / 公众号 / 书籍 / Unknown） | 🟡 P1 | M |
| E4-04 | AI 推荐卡：调用 Claude API，传入 Watchlist top 10，返回 3 个推荐目的地 + 理由 | 🟡 P1 | M |
| E4-05 | AI 推荐卡 loading skeleton 动画 | 🟢 P2 | S |

---

### Epic 5 · AI Travel Agent (F4)

| ID | Ticket | 优先级 | 工作量 |
|----|--------|--------|--------|
| E5-01 | Agent 页面布局：左地图 + 右对话面板 | 🔴 P0 | M |
| E5-02 | 对话 UI：消息气泡（用户 / Agent）+ 输入框 + 发送 | 🔴 P0 | M |
| E5-03 | Claude API 集成：system prompt 注入用户 Watchlist 数据 | 🔴 P0 | L |
| E5-04 | Agent 返回结构化行程 JSON，前端解析渲染行程卡片 | 🔴 P0 | L |
| E5-05 | Turf.js 大圆弧路线：根据行程 JSON 自动在地图上画路线连线 | 🔴 P0 | M |
| E5-06 | 多轮对话：维护 message history，支持修改行程 | 🟡 P1 | M |
| E5-07 | Suggestion chips：快捷触发常见需求 | 🟡 P1 | S |
| E5-08 | Google Places API：行程卡片内展示实时评分 | 🟡 P1 | M |
| E5-09 | Agent thinking 动画（三点加载） | 🟡 P1 | S |
| E5-10 | 行程导出：生成可分享链接 / 存入 itineraries 表 | 🟢 P2 | M |

---

### Epic 6 · Google Maps 数据导入 (F5)

| ID | Ticket | 优先级 | 工作量 |
|----|--------|--------|--------|
| E6-01 | KML 文件上传 UI（拖拽 + 点击） | 🔴 P0 | S |
| E6-02 | KML 解析器：提取 name + coordinates | 🔴 P0 | M |
| E6-03 | 批量默认来源类型选择（YouTube / 公众号 / Unknown 等） | 🔴 P0 | S |
| E6-04 | 导入预览表格：展示解析结果，支持逐条修改 status | 🟡 P1 | M |
| E6-05 | 确认导入：批量写入 Supabase pins 表 | 🔴 P0 | M |
| E6-06 | 导入进度条 + 成功/失败反馈 | 🟡 P1 | S |
| E6-07 | 重复检测：导入时检查坐标相近的已存在 pin | 🟢 P2 | M |

---

### Epic 7 · 部署 & DevOps

| ID | Ticket | 优先级 | 工作量 |
|----|--------|--------|--------|
| E7-01 | Vercel 部署，绑定自定义域名（pinfarer.com 或子域） | 🔴 P0 | S |
| E7-02 | GitHub Actions：push to main 自动触发 Vercel 部署 | 🟡 P1 | S |
| E7-03 | Supabase production 环境配置（RLS rules 验证） | 🔴 P0 | S |
| E7-04 | README 撰写：项目介绍 / 技术栈 / 截图 / live demo 链接 | 🔴 P0 | S |

---

## Part 3 · 开发顺序建议

```
Week 1  E1（初始化）→ E2（地图主页）→ E6（KML 导入，有真实数据）
Week 2  E3（详情页）→ E4（Dashboard）→ E7（部署上线）
Week 3  E5（AI Agent，重点打磨）
Week 4  细节打磨 + README + 准备面试 demo
```

> 建议 Week 2 结束时就部署上线，后续开发直接在 live 环境迭代，简历上可以尽早写 live demo 链接。

---

*Generated for Pinfarer · SW · Melbourne 2026*
