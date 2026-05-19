# Faar Blog

基于 React + Vite 的个人博客前台，配套 Express + SQLite API（阅读量 Redis 防刷可选）。

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
npm install --prefix server

# 同时启动前端 + API
npm run dev:all
```

- 前台：http://localhost:5173
- API：http://localhost:3001

也可分别启动：

```bash
npm run dev          # 仅前端
npm run dev:api      # 仅 API
```

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

## 投稿与审核

1. 用户访问 **投稿**（`/submit`）填写文章，提交后状态为 `pending`
2. 管理员访问 **审核**（`/admin`），输入 `ADMIN_TOKEN` 登录
3. 通过后文章变为 `published` 并出现在首页；驳回可填写原因

```
POST /api/submissions
GET  /api/admin/articles?status=pending
POST /api/admin/articles/:id/approve
POST /api/admin/articles/:id/reject
```

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
