# 学习笔记

> 每完成一个 ticket 后自动追加，记录核心概念、踩的坑、可迁移的认知。

---

### E1 - 项目初始化（Next.js 14 + Tailwind + 环境配置）

- **学到的核心概念：**
  - Next.js App Router：`app/` 目录下每个文件夹就是一个路由，`page.tsx` 是页面，`layout.tsx` 是外层壳（导航、字体等全局配置放这里）
  - CSS 变量（`--coral: #FF6B47`）：在 `globals.css` 里定义一次，全项目用 `var(--coral)` 引用，改颜色只需改一个地方
  - 环境变量：`NEXT_PUBLIC_` 前缀的变量浏览器可以读到，没有这个前缀的只有服务器能读。API keys 绝对不能放进 git 仓库

- **用到的关键 API/函数：**
  - `next/font/google`：Next.js 内置的字体加载器，自动托管 Google Fonts，不依赖外部网络
  - `tailwind.config.ts` 的 `theme.extend`：把 CSS 变量映射成 Tailwind class（`text-coral`、`bg-mint`）

- **容易踩的坑：**
  - `.env.local` 里的 URL 不能写浏览器地址栏的网址（如 `supabase.com/dashboard/...`），要写 API endpoint（`xxx.supabase.co`）
  - Tailwind 的 `content` 数组要包含所有用到 class 的文件路径，否则 class 会被 tree-shake 掉

- **一句话总结：** Next.js 的 App Router 用文件夹结构代替了路由配置，CSS 变量 + Tailwind 是现代前端设计系统的标配做法。

---

### E2 - 地图主页（Mapbox GL JS + 三色 Pin）

- **学到的核心概念：**
  - 客户端组件（`'use client'`）：Mapbox 需要浏览器的 DOM，不能在服务器渲染，所以加 `'use client'` 告诉 Next.js 只在浏览器跑
  - `dynamic(() => import(...), { ssr: false })`：延迟加载 + 禁用服务端渲染，Mapbox 这类地图库的标准做法
  - `useRef`：存 map 实例，避免每次组件重渲染都重新创建地图
  - `useMemo`：缓存计算结果，`visiblePins` 只在 `pins/filter/filterTag` 真正变化时才重新计算，避免不必要的 marker 重建

- **用到的关键 API/函数：**
  - `new mapboxgl.Map({ projection: 'globe' })`：开启 3D 地球仪模式
  - `map.setFog()`：设置大气层效果（地球仪边缘的蓝色光晕 + 星星）
  - `new mapboxgl.Marker({ element, anchor: 'center' })`：用自定义 HTML 元素作为 pin，`anchor: 'center'` 确保圆点精确定位在坐标点上

- **容易踩的坑：**
  - Marker 点击后"跳到左上角"：原因是每次父组件重渲染，`visiblePins` 是新数组引用，触发 marker 全部删除重建，有一帧在 (0,0)。解决：`useMemo` 缓存
  - 点击面积太小（12px 圆点）：用 32px 透明外层包住，`pointer-events:none` 加到视觉点上，让外层负责接收点击

- **一句话总结：** 地图组件 = 一次初始化（useEffect 空依赖）+ 一次 markers 管理（useEffect 依赖 pins），两个 effect 职责分离是行业常用模式。

---

### E1-03 / Task 3 - Supabase 数据库配置

- **学到的核心概念：**
  - Supabase 是托管的 PostgreSQL，免费额度够个人项目用
  - RLS（Row Level Security）：数据库层面的权限控制，`create policy "allow all" on pins for all using (true)` = 暂时允许所有人读写（单用户 MVP 阶段）
  - 三者关系：GitHub 存代码 → Vercel 把代码变成网站 → Supabase 存数据

- **用到的关键 API/函数：**
  - `createClient(url, key)`：创建 Supabase 客户端，一个项目只需要一个实例（`lib/supabase.ts` 单例模式）
  - `supabase.from('pins').select('*').order('created_at')`：SQL 的 Next.js 写法

- **容易踩的坑：**
  - Supabase URL 要用 `xxx.supabase.co` 格式，不是网页控制台的地址
  - `text[]` 类型（数组）需要手动 `alter table` 添加，不在初始建表 SQL 里

- **一句话总结：** Supabase = 不用自己搭服务器的 PostgreSQL，SDK 把 SQL 查询包装成链式调用，行业里叫"ORM-like"写法。

---

### E6 - KML / JSON / CSV 数据导入

- **学到的核心概念：**
  - KML：Google Maps 的地理数据格式，XML 结构，用 `DOMParser` 在浏览器里解析
  - GeoJSON：地理数据的现代标准格式，JSON 结构，坐标是 `[lng, lat]`（注意是先经度后纬度）
  - Geocoding：把地名转换成坐标的过程。Nominatim 是 OpenStreetMap 的免费服务，不需要 API key，限速 1次/秒

- **用到的关键 API/函数：**
  - `DOMParser().parseFromString(text, 'application/xml')`：浏览器内置的 XML 解析器
  - `file.text()`：把上传的文件读成字符串
  - 分批 insert：每次最多 100 条，用 `for` 循环 + `slice` 分批，避免超过 Supabase 单次请求限制

- **容易踩的坑：**
  - CSV 文件可能有 BOM（`﻿` 隐藏字符）导致 header 识别失败，要先 `replace(/^﻿/, '')`
  - Google Maps CSV 有时是 Tab 分隔，有时是逗号，要自动检测
  - Nominatim 每秒只能请求1次，1000个地点大约要 20 分钟，需要进度条让用户知道在处理

- **一句话总结：** 数据导入 = 解析文件 + 可选 geocoding + 分批写入数据库，这个三段式流程在数据迁移场景里非常通用。

---

### 自定义标签系统（Tags + Bulk Status）

- **学到的核心概念：**
  - `text[]`（PostgreSQL 数组类型）：一个字段存多个值，比建关联表简单，适合标签这种不需要复杂查询的场景
  - PATCH HTTP 方法：用于"部分更新"一条记录（对比 PUT = 完整替换）。行业约定：GET 查询，POST 新增，PATCH 部分更新，DELETE 删除
  - `useMemo` vs `useCallback`：`useMemo` 缓存值，`useCallback` 缓存函数——两者都是"如果依赖没变就不重新计算"的优化手段

- **用到的关键 API/函数：**
  - `PATCH /api/pins/[id]`：动态路由，`[id]` 是文件夹名，Next.js 把 URL 里的值传给 `params.id`
  - `supabase.from('pins').update(body).eq('id', id).select().single()`：更新单条记录并返回更新后的数据

- **容易踩的坑：**
  - 标签去重用 `arr.filter((v, i, a) => a.indexOf(v) === i)` 代替 `[...new Set(arr)]`，因为项目的 TypeScript 配置不支持 Set 的 spread

- **一句话总结：** `text[]` 存标签是"够用就行"的工程选择，业界叫 YAGNI（You Aren't Gonna Need It）——不建独立表，直到真的需要复杂查询时再迁移。

---

### Bug Fix - Pin 点击跳位 + 点击面积

- **学到的核心概念：**
  - React 引用稳定性：每次组件 render，没有 `useMemo` 保护的数组/对象都是新引用，即使内容一样。`useEffect` 依赖的是引用，所以会误触发
  - 透明 hit area 技巧：视觉元素和可点击区域分离，外层 div 大（32px）负责接收点击，内层 div 小（12px）负责显示。`pointer-events:none` 让视觉层"透明"给交互层

- **容易踩的坑：**
  - Mapbox `Marker` 默认 anchor 是 `bottom-center`（像图钉一样尖端对准坐标），自定义圆点 marker 要加 `anchor: 'center'`

- **一句话总结：** 性能 bug 和 UI bug 往往同源——理解 React 的渲染机制（引用变了就重渲染）能一次解决两个问题。

---

### E3 - 地点详情页（Hero 地图 + 信息卡片 + AI 介绍）

- **学到的核心概念：**
  - Server Component vs Client Component 的拆分原则：能在服务器取的数据就在服务器取（`getData()`），需要交互的部分拆成 Client Component
  - `dynamic(() => import(...), { ssr: false })`：Mapbox 这类依赖浏览器 DOM 的库必须用动态导入，在服务端渲染会报错
  - Anthropic SDK：`client.messages.create()` 是行业标准的 LLM API 调用方式，`max_tokens` 控制生成长度

- **用到的关键 API/函数：**
  - `supabase.from('pins').select('*').eq('country', pin.country).neq('id', id).limit(3)`：链式查询，`.neq` = not equal，排除自身
  - CSS `@keyframes`：纯 CSS 动画，不需要 JS 控制加载状态小点

- **容易踩的坑：**
  - Mapbox 地图在 Server Component 里会报错，必须用 `dynamic` + `ssr: false` 包一层
  - `ANTHROPIC_API_KEY` 没有 `NEXT_PUBLIC_` 前缀 = 只有服务器能读，浏览器无法访问，这是正确做法（保护 API key）

- **一句话总结：** 详情页 = 服务端取数据 + 多个独立 Client Component 各管一块交互，职责分离让每个组件只需要理解自己那一块。
