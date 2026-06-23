# 我用 Claude + Mapbox 做了一个 AI 旅行地图 — 用 Vibe Coding 从零到上线

## 当你的旅行愿望清单散落在五个 App 里，你会去造第六个

我有一个习惯——到处保存"想去的地方"。

法罗群岛的一个小渔村，从 YouTube 上看到的。大阪某家拉面店，朋友发在微信群里的。巴塔哥尼亚的一条徒步路线，深夜刷博客时发现的。问题是：这些地方分散在谷歌地图、浏览器收藏夹、微信收藏、小红书点赞里，彼此之间毫无关联，大多数最后都石沉大海，完全忘记了。

我想要一个地方，把所有"去过的"、"想去的"、"随手梦想过的"地点都钉在同一张地图上——然后，当我真的要规划一次旅行时，AI 能读懂我的收藏记录，帮我生成一个真正属于我的行程，而不是泛泛的"东京十大必去景点"。

这就是 Pinfarer 的来由。[在线体验 → pinfarer.vercel.app](https://pinfarer.vercel.app) | [GitHub → github.com/sarahwangy/pinFarer](https://github.com/sarahwangy/pinFarer)

整个项目用 Vibe Coding 方式开发完成——以 Claude Code 作为 AI 开发搭档，通过一套结构化技能（Skills）把自然语言转化为真正可运行的代码。下面我会具体讲这个过程。

---

## Pinfarer 是什么？

Pinfarer 是一个个人旅行地图 + AI 行程规划助手。你可以在一个真实的球形地球上（不是平面地图）用三种状态标记目的地：**Visited（已去过）**、**Watchlist（想去）**、**Dream（梦想清单）**。每个地点会由 AI 自动生成介绍、城市信息和房产数据。当你准备规划一次旅行时，AI 行程规划器读取你保存的地点，生成专属的逐日行程。

数据在应用里的流转过程：

```
用户点击地球
      ↓
Mapbox GL JS（球形投影 + 飞行动画）
      ↓
地点保存 → POST /api/pins → Supabase（PostgreSQL + JSONB）
      ↓
地点详情页加载
      ↓
GET /api/ai/summary → Claude Sonnet 4.6
      ↓
AI 生成地点介绍 + 城市数据 + 房产数据
      ↓
GET /api/pixabay → Pixabay（地点封面图）
      ↓
渲染到地点详情页
      ↓
AI 行程规划：用户选择地点 → POST /api/ai/itinerary → Claude → 逐日行程 + Mapbox 路线图层
```

---

## 我在解决什么问题

我的谷歌地图"收藏"列表里有几百个地点。问题是：每个地点的图标都一模一样。"我六个月内真的要去"和"当时觉得看起来不错"，在地图上没有任何区别。地点本身也没有任何额外信息，就只有一个名字和坐标。每次真正要规划旅行，我要同时打开谷歌地图、浏览器、备忘录和电子表格。

更根本的问题是：我散落在各处的收藏代表着真实的好奇心和真实的意图，只是因为它们分散在不同平台，这些愿望对我来说几乎是不可见的。

我想要一个工具，能做到三件事：
1. 区分"去过"、"在计划"、"随手收藏"这三种不同的心理状态
2. 每当我钉下一个地点时，自动提供关于这个地方的有用信息
3. 能读懂我保存的地点，把它们转化成一份真正的旅行计划

这就是这个产品的核心。其他的功能——球形地图、数据看板、KML 导入——都是在认真实现这三个目标时自然长出来的。

---

## 技术栈

| 层级 | 技术 | 选择理由 |
|---|---|---|
| 框架 | Next.js 14 (App Router) | 服务端组件 + API 路由在一个项目里 |
| 语言 | TypeScript 5 | 复杂地点和行程数据结构需要类型安全 |
| 地图 | Mapbox GL JS（球形投影） | 真正的球体渲染，飞行动画流畅 |
| AI | Anthropic Claude Sonnet 4.6 | 结构化数据提取 + 自然语言生成 |
| 数据库 | Supabase（PostgreSQL + JSONB） | JSONB 支持灵活数据结构；免费额度慷慨 |
| 图片 | Pixabay API（服务端代理） | 免费，UI 里无水印 |
| 认证 | NextAuth（Google OAuth） | 最快实现用户隔离的地点数据 |
| 样式 | Tailwind CSS + shadcn/ui | 快速、一致的组件库 |
| 部署 | Vercel | Next.js 零配置托管 |

---

## API 使用详解

### Anthropic Claude Sonnet 4.6 — 应用的大脑

Claude 在 Pinfarer 里承担三项不同的工作，每一项的 Prompt 设计都不一样。

**工作一：地点介绍生成**
每当你钉下一个地点，`/api/ai/summary` 会获取一段 2-3 句话的地点介绍。Prompt 传入地点名和国家，要求 Claude 写出有感染力又有信息量的文字——不是维基百科摘要，而是你会告诉朋友的那种描述。

**工作二：结构化城市数据提取**
地点详情页有一个"城市数据"标签：人口、官方语言、货币、气候描述、饮食文化亮点、签证要求（针对澳大利亚护照持有人）、安全等级（1-5分）和当地标志性动物。这些全部通过一次 Claude API 调用生成，系统提示里包含严格的 JSON Schema。

这里的核心技巧是**通过系统提示约束输出为结构化 JSON**。我不是让 Claude "描述这座城市"，而是让它返回一个特定的 JSON 对象，每个字段都有明确的类型定义。这让响应可以直接在 TypeScript 里使用，不需要解析步骤。

```typescript
// app/api/ai/summary/route.ts
const systemPrompt = `你是一个旅行数据助手。
只返回符合以下精确 Schema 的合法 JSON——不要 Markdown，不要解释文字：
{
  "intro": "string（2-3句话，有感染力且信息丰富）",
  "cityData": {
    "population": "string（如'370万'）",
    "language": "string",
    "currency": "string（货币代码 + 名称）",
    "climate": "string（2句话）",
    "food": "string（2-3句话介绍当地饮食文化）",
    "visa": "string（针对澳大利亚护照持有人）",
    "safety": number（1-5，5为最安全）,
    "animals": "string（标志性动物，或'N/A'）"
  }
}`

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: 'user', content: `地点：${name}，${country}` }]
})
```

**工作三：AI 行程规划**
这是最复杂的 Prompt。Claude 接收：所选地点列表（名称、国家、经纬度、用户自己的备注）、旅行天数、出行风格（轻松/均衡/密集）和偏好标签（美食、户外、文化等）。返回结构化的 JSON 行程对象，包含每天的具体活动安排，精确到时间段。

让这个功能真正有用的关键洞察：Claude 知道用户*实际保存了*哪些地点，意味着用户表达了真实的兴趣。生成的行程不是泛泛而谈——它围绕你真正在意的地方展开。

---

### Mapbox GL JS — 地球，不是平面地图

选择球形投影而不是标准墨卡托平面地图，是最早的设计决策之一，也是改变整个产品感觉的决策。

Mapbox 在地图样式配置里支持 `projection: 'globe'`。在球形地图上，你的地点在真实的空间关系中存在。点击一个地点，摄像机会旋转并飞向它。看着地球为你的目的地旋转——这个交互本身就让产品的情感体验与平面地图完全不同。

```typescript
// components/Map.tsx
const map = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  projection: 'globe',           // ← 关键设置
  center: [0, 20],
  zoom: 1.8,
  antialias: true,
})

// 飞向一个地点
map.flyTo({
  center: [pin.lng, pin.lat],
  zoom: 10,
  duration: 2000,
  essential: true,
})
```

每个地点标记根据状态显示不同颜色：绿色（已去过）、琥珀色（想去）、紫色（梦想清单）。标记使用 CSS 过渡动画，悬停时会有轻微的脉冲效果。

**地理编码**通过服务端代理调用 Mapbox 的地理编码 API 完成。用户输入地点名称时，应用将名称转换为坐标——在服务端完成，避免 Mapbox Token 在客户端请求中过度暴露。

---

### Supabase — 带 JSONB 的 PostgreSQL

Pin 的数据表使用 `place_data` 字段（类型 `jsonb`）来存储 AI 生成的城市和房产数据。这是有意为之的设计选择：东京的城市数据和墨尔本某个郊区的房产数据，结构完全不同。与其创建多张表或一堆可空字段，JSONB 让每个地点携带它需要的精确数据结构。

```sql
create table if not exists pins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  name        text not null,
  country     text,
  region      text,
  lat         double precision not null,
  lng         double precision not null,
  status      text not null default 'watchlist',
  source      text not null default 'unknown',  -- 发现来源
  source_url  text,
  notes       text,
  ai_summary  text,
  place_data  jsonb,          -- 灵活存储：城市数据或房产数据
  tags        text[] default '{}',
  created_at  timestamptz default now()
);
```

`source` 字段记录地点的发现来源：YouTube、微信、小红书、手动添加或 KML 导入。这个字段为数据看板的发现来源图表提供数据。

---

### Pixabay — 没有水印的地点图片

每个地点详情页都有封面图。Mapbox 卫星图像提供精准的鸟瞰视角，Pixabay 提供地面视角的备用照片。Pixabay API Key 完全在服务端代理，客户端看不到。

---

## AI 技术与技巧

### 1. 通过系统提示约束结构化输出

让 Claude 持续输出机器可读数据，最可靠的方式是在系统提示里指定精确的 JSON Schema，并加上明确约束："只返回合法 JSON。不要 Markdown。不要解释文字。"这消除了响应解析逻辑的需要，让输出可以直接在 TypeScript 中使用。

当 Schema 很复杂时（比如行程里嵌套的每日/活动对象），我在系统提示里定义完整结构，包含字段名、类型和示例值。Claude 非常擅长忠实地遵循这些约束。

```typescript
// 行程 Prompt 结构
const systemPrompt = `只返回合法 JSON：
{
  "title": "string",
  "days": [
    {
      "day": number,
      "date": "string",
      "location": "string",
      "activities": [
        {
          "time": "string（如'上午9:00'）",
          "activity": "string",
          "duration": "string",
          "tips": "string"
        }
      ]
    }
  ],
  "travelTips": ["string"]
}`
```

### 2. 基于真实上下文的个性化

AI 行程规划的 Prompt 包含用户真实保存的地点——不只是地点名称，还有用户自己写的每条备注。这意味着 Claude 有了真实上下文："用户去过京都，备注说岚山很棒但春天人很多；想去大阪；梦想去北海道。"生成的行程会反映这段历史，而不是通用的旅行模板。

```typescript
const pinsContext = selectedPins.map(pin => 
  `- ${pin.name}（${pin.country}）[${pin.status}]${pin.notes ? `："${pin.notes}"` : ''}`
).join('\n')

const userPrompt = `规划一次${days}天的${travelStyle}旅行。
我保存的目的地：
${pinsContext}

旅行偏好：${tags.join('、')}
旅行重点：${tripFocus}`
```

### 3. 地点类型识别

有些地点是城市（东京、巴黎、墨尔本），有些是考虑移居的具体社区或郊区（Fitzroy、Bondi、Notting Hill）。应用会识别正在查看的地点类型，并据此显示不同的 AI 生成数据。

城市视图 → 人口、语言、货币、气候、饮食、签证、安全等级、标志性动物
房产/郊区视图 → 所在区议会、学区、交通评分、到 CBD 距离、中位房价

这个识别逻辑在 `lib/place-type.ts` 里，结合地点的 `region` 字段和基于已知郊区名称模式的简单启发式规则实现。

### 4. 流式输出 vs 一次性 API 调用

对于简短的地点介绍（2-3句话），我使用标准的非流式 Claude API 调用。延迟不到一秒，流式输出会增加复杂度而不带来 UX 收益。

对于 AI 行程规划，可能生成 3-14 天的内容，我使用流式输出来实时显示行程生成过程。UI 显示骨架屏状态，然后行程内容一天一天地流式出现。这让 5 秒的生成过程感觉是在互动，而不是卡住了。

```typescript
// app/api/ai/itinerary/route.ts — 流式响应
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }]
})

return new Response(
  new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    }
  }),
  { headers: { 'Content-Type': 'text/event-stream' } }
)
```

### 5. 通过服务端代理保护 API Key

所有第三方 API Key（Anthropic、Pixabay、Mapbox 地理编码）都从 Next.js API 路由调用，永远不出现在客户端。这意味着：
- `ANTHROPIC_API_KEY` 不会出现在浏览器网络请求里
- `PIXABAY_API_KEY` 完全在服务端
- 只有 `NEXT_PUBLIC_MAPBOX_TOKEN` 暴露给客户端（地图渲染必需）——但它是带域名限制的公开只读 Token

这是 Next.js 全栈应用调用付费 API 的标准模式。保护 Key 安全，同时将流量控制职责放在服务端。

### 6. KML 解析 — 与用户的数据在一起

Google Takeout 导出的收藏地点是 KML 文件。KML 是基于 XML 的格式，包含带名称、描述和 `<coordinates>` 的 `<Placemark>` 元素。我在 `lib/kml-parser.ts` 里写了一个解析器：

1. 读取原始 KML 字符串
2. 用正则表达式找到所有 `<Placemark>` 元素
3. 提取名称和坐标
4. 返回 `{ name, lat, lng }` 对象数组

导入流程让用户预览所有解析出的地点，为每个地点指定状态（已去过/想去/梦想清单），然后一键批量导入。几年的谷歌地图收藏，几秒钟变成 Pinfarer 的地点。

```typescript
// lib/kml-parser.ts
export function parseKML(kmlString: string): ParsedPlace[] {
  const placemarks = kmlString.match(/<Placemark[\s\S]*?<\/Placemark>/g) ?? []
  
  return placemarks.map(pm => {
    const name = pm.match(/<name>(.*?)<\/name>/)?.[1] ?? '未知地点'
    const coords = pm.match(/<coordinates>(.*?)<\/coordinates>/)?.[1]?.trim()
    const [lng, lat] = coords?.split(',').map(Number) ?? [0, 0]
    return { name, lat, lng }
  }).filter(p => p.lat !== 0 && p.lng !== 0)
}
```

---

## Vibe Coding 开发过程

我用 Claude Code——Anthropic 的命令行工具——作为主要开发环境来构建 Pinfarer。但我不是随意地给 Claude 发提示，而是使用了一套结构化技能（Skills），它们强制执行正规的软件开发工作流。

**`superpowers:brainstorming`** — 开始任何新功能的代码之前，这个技能会先探索意图、挖掘边界情况、提出多种实现方案。在 AI 行程规划功能上，头脑风暴暴露了一个我没想到的决策：行程应该一次全部生成，还是逐天生成？我们最终选择了一次生成 + 流式显示，这给出了最好的 UX。

**`superpowers:writing-plans`** — 头脑风暴之后，这个技能输出一份具体的实施计划：文件路径、函数签名、数据结构、变更顺序。对于 KML 导入功能，计划覆盖了 `lib/kml-parser.ts`、`app/import/page.tsx`、批量创建地点的 API 路由、UI 预览组件——在我写第一行代码之前，全部都已经明确。

**`superpowers:subagent-driven-development`** — 计划里的每个任务由一个全新的 AI Agent 执行，以规格说明为上下文。这让每个任务保持专注。每个任务完成后，进行质量审查，再进入下一个任务。

**`superpowers:systematic-debugging`** — 当我修改地图样式之后 Mapbox 球形地图停止渲染，这个技能引导我完成根因分析：检查样式 URL、检查投影设置、检查容器 div 的高度（是 0px——容器没有设置高度）。不只是"修复症状"，而是理解为什么会出问题。

**`superpowers:verification-before-completion`** — 在标记任何功能完成之前，这个技能对照规格说明检查实际行为：行程真的能渲染吗？KML 导入能优雅地处理缺少坐标的文件吗？流式输出在慢网络下正常工作吗？这些问题都要在运行的应用上得到回答，而不是假设它没问题。

**`superpowers:frontend-design`** — 对于数据看板和地点详情页，我用这个技能生成 HTML 静态稿，在浏览器里预览，然后再写任何 React 代码。这让我在写组件代码之前就能验证布局和信息层次——它抓住了两个我原本要重构的布局决策。

**具体例子——构建 AI 行程规划功能：**

1. `brainstorming`：规划器需要哪些输入？地图面板和行程面板如何布局？用户选了五个不同国家的地点怎么办？
2. `writing-plans`：计划明确了 `app/ai/page.tsx`（选择 UI + 行程展示）、`app/api/ai/itinerary/route.ts`（流式 Claude 调用）和 `types/itinerary.ts`（响应数据结构的 TypeScript 类型）
3. `frontend-design`：两栏布局的 HTML 静态稿（左侧地点选择器，右侧行程 + 地图），在浏览器里预览
4. `subagent-driven-development`：三个 Agent——一个负责 API 路由，一个负责选择 UI，一个负责带流式的行程展示
5. `verification-before-completion`：用 3 天行程、14 天行程、单个地点选择和跨不同大洲的地点分别测试

---

## 各页面介绍

### 地球地图（主页）

主视图是地球——全视口 Mapbox 卫星地图，球形投影。你的地点以彩色标记出现：绿色（已去过）、琥珀色（想去）、紫色（梦想清单）。左侧侧边栏列出所有地点，带有状态和标签的筛选控件。

点击一个地点会触发 `map.flyTo()`——地球平滑旋转到那个位置。点击标记会打开一个小弹窗，显示地点名称和状态，以及打开完整地点详情页的按钮。

### 地点详情页

每个地点有自己的页面，路径为 `/place/[id]`。页面结构：

- **封面图**：Mapbox 卫星鸟瞰 + Pixabay 地面视角照片
- **AI 介绍**：2-3 句关于该地点的描述，首次加载时生成
- **状态选择器**：在线修改已去过/想去/梦想清单
- **个人备注**：自由文本，带防抖自动保存
- **城市数据标签**：人口、语言、货币、气候、饮食、签证、安全等级、标志性动物
- **房产数据标签**：区议会、学区、交通评分、到 CBD 距离、中位房价
- **附近地点**：同一国家的其他地点

城市数据和房产数据在首次访问时由 Claude 生成，并缓存在 `place_data` JSONB 字段里。后续访问直接读数据库。

### 数据看板

数据看板给出你旅行地图的全局视图：

- **KPI 卡片**：地点总数、已去过数量、想去数量、梦想数量
- **环形图**（自定义 SVG）：各状态占比
- **条形图**（自定义 SVG）：发现来源分布——YouTube、微信、小红书、手动添加、KML 导入
- **国家排名列表**：地点最多的国家，带进度条
- **标签云**：所有地点的全部标签

两张图表都是 React 里的 SVG 元素——没有用图表库。这是有意为之的选择，既控制了包体积，也让我真正理解了 SVG 渲染是怎么工作的。

### AI 行程规划

行程规划是一个两栏页面。左栏：地点选择器（所有已保存地点的复选框列表）和行程配置（天数、风格、偏好标签）。右栏：生成的行程和实时 Mapbox 地图，用虚线连接所选地点。

生成开始后，左栏锁定，右栏显示流式响应——你会看到行程一天一天地实时出现。地图上的路线线条会更新，显示所选地点的地理关系。

### KML 导入

一个支持拖放的 Google Takeout KML 文件上传区。拖入文件之后：
1. 解析器在客户端运行，显示所有检测到的地点预览列表
2. 每行显示名称和坐标，带一个状态下拉菜单（默认为"想去"）
3. "全部导入"将批量数据发送到 API，一次性创建所有地点
4. 用户跳转到地图，所有新地点都可见

---

## 实例解析：AI 行程规划的完整运作过程

用户生成一份行程时，实际发生了什么：

**第一步——选择地点**
用户勾选已保存地点旁的复选框。假设他们选择了：京都（已去过）、大阪（想去）和奈良（想去）。他们对京都的备注写着"嵯峨野很棒，避开樱花旺季"。

**第二步——配置行程**
5天。出行风格：均衡。偏好标签：文化、美食。

**第三步——API 调用**
`POST /api/ai/itinerary` 带着地点数据和配置发出。系统提示指示 Claude 返回特定的 JSON 结构。用户消息包含地点及其状态和备注。

**第四步——流式响应**
Claude 以 JSON 字符串形式返回行程。API 路由用 `ReadableStream` 将内容流式传回客户端。前端读取数据块并逐步显示。

**第五步——渲染**
流式传输完成后，JSON 解析为 `ItineraryDay[]` 对象。每天渲染为一张卡片，包含按时间段排列的活动。Mapbox 地图显示三个地点，用虚线按顺序连接。

**第六步——为什么它是个性化的**
生成的计划不会泛泛地按"京都→奈良→大阪"走标准路线。它注意到用户之前觉得京都人多，建议避开旺季或选择早晨前往；它将用户的美食偏好融入餐厅推荐；它将大阪那天的行程安排在美食体验上，因为大阪的饮食声誉和用户表达的兴趣高度吻合。

---

## 我学到了什么

**球形投影不只是视觉选择。** 选择球体而不是平面地图，改变了整个产品的情感基调。平面地图是数据库视图。球形地图是旅行幻想。同样的数据，同样的地点——但一个让你感觉是在管理数据，另一个让你感觉是在探索世界。这是整个项目里最重要的设计决策。

**JSONB 适合灵活的数据结构。** 我曾经想为城市数据和房产数据创建独立的表。最后，一个 JSONB 字段处理了两者，加上未来可能出现的任何数据结构。代价是失去了 SQL 字段级别的验证，但对于持续演化的 AI 生成内容来说，灵活性比严格性更重要。

**流式输出改变感知性能。** 5秒的 Claude 响应感觉在等待。5秒的实时流式响应感觉在工作。实际延迟完全一样——但一个感觉慢，另一个感觉快。对于任何超过 2 秒的生成式 AI 功能，流式输出基本上是必须的。

**KML 导入是一道护城河。** 加上 Google Takeout 导入，Pinfarer 从"从头开始"变成了"把你现有的数据迁移过来"。有几百个谷歌地图收藏的用户，不到一分钟就能导入完毕。这个单一功能完全改变了产品的用户采纳故事。

**"与用户的数据在一起"是一个产品原则。** 不要让人重新开始。谷歌地图里存着用户多年的地点数据。允许他们带着这些数据过来——是对他们时间和历史的一种尊重。

**Vibe Coding 是真正的软件工程，只是更快。** 那些结构化技能——编码前先头脑风暴、实现前先写计划、完成前先验证——不是绕开工程严谨性的捷径。它们就是工程工作流，只是被压缩了、由 AI 辅助了。我在头脑风暴里发现了原本要花几小时重构的设计问题。我在验证阶段发现了原本会上生产的 Bug。这些技能是在强化纪律，而不是取代它。

---

*Pinfarer 在线体验地址：[pinfarer.vercel.app](https://pinfarer.vercel.app)。完整源码在 [github.com/sarahwangy/pinFarer](https://github.com/sarahwangy/pinFarer)。如果你有谷歌地图的 KML 导出文件，想试试导入功能，大概三十秒就能完成。*
