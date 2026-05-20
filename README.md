# Faar Blog

基于 React + Vite 的个人博客**前台**，通过 HTTP 请求独立部署的 **ablog**（Gin API）获取数据。

## 部署架构

```
浏览器  →  faar（本仓库，静态页面）  →  /api/v1/*  →  ablog（Go API，如 :8081）
```

| 项目 | 职责 | 默认端口 |
|------|------|----------|
| **faar** | 页面、路由、后台 UI | 开发 5173 / 生产 80 |
| **ablog** | 仅 JSON API，**不需要**托管前端静态文件 | 8081 |

两个服务分开部署即可；**不必**在 ablog 里加静态文件路由。

## 功能

| 编号 | 功能 | 说明 |
| --- | --- | --- |
| F01 | 文章列表 | 分页展示标题、简介、封面、时间、阅读量、标签 |
| F02 | 文章详情 | Markdown 渲染、代码高亮、目录 TOC |
| F03 | 标签/分类筛选 | `/tag/:name`、`/category/:name` |
| F04 | 搜索 | SQL `LIKE` 全文搜索 |
| F05 | 归档 | `/archive`、`/archive/:year/:month` |
| F06 | 评论 | Giscus 嵌入（需配置环境变量） |
| F07 | 阅读量 | 访问详情页 PV+1，Redis `SET NX` 防刷 |
| F08 | 响应式 | PC / 平板 / 手机适配 |
| — | 用户投稿 | `/submit` 提交 Markdown 文章，待审核 |
| — | 后台审核 | `/admin` 管理员通过/驳回，通过后公开发布 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动 Gin 后端（ablog 项目，默认 8081 端口）
cd ../ablog && go run ./cmd/server

# 启动前端
npm run dev
```

- 前台：http://localhost:5173
- API：http://localhost:8081/api/v1（Vite 代理 `/api/v1`）

后端端口在 ablog 的 `configs/config.yaml` 的 `server.port` 中配置；faar 开发代理在 `vite.config.js` 的 `target` 中对应修改。

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

| 变量 | 说明 |
| --- | --- |
| `VITE_GISCUS_REPO` | Giscus 仓库 `owner/repo` |
| `VITE_GISCUS_REPO_ID` | Giscus repo id |
| `VITE_GISCUS_CATEGORY_ID` | Giscus category id |
| `REDIS_URL`（服务端） | 如 `redis://127.0.0.1:6379`，未配置时使用内存防刷 |
| `ADMIN_TOKEN`（服务端） | 后台审核 API 令牌，默认开发值 `dev-admin-token` |

## 后台管理（B01–B07）

| 功能 | 路径 |
| --- | --- |
| B01 登录/登出 | `/login`，JWT + Refresh Token |
| B02 发布文章 | `/manage/articles/new`，Markdown 实时预览 |
| B03 编辑文章 | `/manage/articles/:id/edit`，自动更新 `updated_at` |
| B04 删除文章 | 文章列表「删除」，软删除 |
| B05 文章列表 | `/manage/articles`，筛选/搜索 |
| B06 标签/分类 | `/manage/tags`、`/manage/categories` |
| B07 个人资料 | `/manage/profile` |

默认账号：`admin` / `admin123`（可通过 `ADMIN_PASSWORD` 环境变量修改）

```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/manage/articles
POST /api/manage/articles
PUT  /api/manage/articles/:id
DELETE /api/manage/articles/:id
```

访客投稿（`/submit`）仍为公开接口，待审核文章在后台「待审核」筛选中处理。

## API 概览

```
GET  /api/articles?page&pageSize&tag&category&q&year&month
GET  /api/articles/:slug
POST /api/articles/:id/view
GET  /api/tags
GET  /api/categories
GET  /api/archives
```

## 项目结构

```
src/
  api/           # Axios 请求
  components/    # 通用组件
  pages/         # 页面
  styles/        # 全局样式
server/          # Express + SQLite API
```
