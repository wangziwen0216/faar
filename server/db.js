import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { migrate } from './migrate.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'blog.db')

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    cover_image TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    published_at TEXT NOT NULL,
    view_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS article_tags (
    article_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
  );
`)

migrate(db)

const count = db.prepare('SELECT COUNT(*) as c FROM articles').get().c

if (count === 0) {
  seed(db)
}

function seed(database) {
  const insertArticle = database.prepare(`
    INSERT INTO articles (slug, title, summary, cover_image, content, category, published_at, view_count, status)
    VALUES (@slug, @title, @summary, @cover_image, @content, @category, @published_at, @view_count, 'published')
  `)

  const insertTag = database.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
  const getTagId = database.prepare('SELECT id FROM tags WHERE name = ?')
  const linkTag = database.prepare(
    'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
  )

  const samples = [
    {
      slug: 'welcome-to-faar',
      title: '欢迎来到 Faar 博客',
      summary: '基于 React + Vite 的个人博客前台，支持 Markdown、标签筛选与阅读量统计。',
      cover_image: 'https://picsum.photos/seed/faar1/800/450',
      category: '随笔',
      published_at: '2026-05-10T08:00:00.000Z',
      view_count: 128,
      tags: ['React', '博客'],
      content: `# 欢迎来到 Faar

这是一篇示例文章，用于演示 **Markdown 渲染** 与代码高亮。

## 功能一览

- 文章列表分页
- 标签 / 分类筛选
- 全文搜索
- 按年月归档

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('Faar'))
\`\`\`

## 二级标题示例

正文支持 GFM 表格、任务列表等扩展语法。

| 功能 | 状态 |
| --- | --- |
| Markdown | ✅ |
| 代码高亮 | ✅ |
| TOC | ✅ |

> 开始写作吧！`,
    },
    {
      slug: 'react-router-v7-guide',
      title: 'React Router v7 路由实践',
      summary: '在 Vite 项目中配置 BrowserRouter、嵌套路由与动态参数的最佳实践。',
      cover_image: 'https://picsum.photos/seed/faar2/800/450',
      category: '前端',
      published_at: '2026-04-18T10:30:00.000Z',
      view_count: 256,
      tags: ['React', '路由'],
      content: `# React Router v7

使用 \`createBrowserRouter\` 或 \`<BrowserRouter>\` 组织页面结构。

## 动态路由

\`/posts/:slug\` 可获取文章详情。

\`\`\`tsx
<Route path="/posts/:slug" element={<ArticleDetailPage />} />
\`\`\`

## 查询参数

列表页通过 \`?page=1&tag=React\` 传递筛选条件。`,
    },
    {
      slug: 'redis-pv-counter',
      title: '阅读量统计与 Redis 防刷',
      summary: '使用 Redis SET + TTL 限制同一访客短时间内重复计数，保证 PV 统计更准确。',
      cover_image: 'https://picsum.photos/seed/faar3/800/450',
      category: '后端',
      published_at: '2026-03-22T14:00:00.000Z',
      view_count: 89,
      tags: ['Redis', 'Node.js'],
      content: `# Redis 防刷 PV

每次访问详情页时：

1. 生成访客指纹（IP + User-Agent 哈希）
2. Redis \`SET pv:{articleId}:{fingerprint} 1 EX 3600 NX\`
3. 仅当 key 不存在时，数据库 \`view_count + 1\`

\`\`\`bash
redis-cli SET pv:1:abc123 1 EX 3600 NX
\`\`\`

未配置 Redis 时，服务端会回退到内存 Map 实现相同逻辑。`,
    },
    {
      slug: 'responsive-blog-layout',
      title: '响应式博客布局设计',
      summary: '使用 CSS Grid 与媒体查询，在 PC、平板、手机上提供一致的阅读体验。',
      cover_image: 'https://picsum.photos/seed/faar4/800/450',
      category: '前端',
      published_at: '2026-02-05T09:15:00.000Z',
      view_count: 42,
      tags: ['CSS', '响应式'],
      content: `# 响应式布局

- **PC**：双栏布局，正文 + 侧边 TOC
- **平板**：单栏，TOC 折叠为顶部导航
- **手机**：精简导航，卡片全宽

\`\`\`css
@media (max-width: 768px) {
  .article-layout {
    grid-template-columns: 1fr;
  }
}
\`\`\``,
    },
    {
      slug: 'giscus-comments-setup',
      title: '接入 Giscus 评论',
      summary: '基于 GitHub Discussions 的嵌入式评论，零后端维护成本。',
      cover_image: 'https://picsum.photos/seed/faar5/800/450',
      category: '随笔',
      published_at: '2026-01-12T16:45:00.000Z',
      view_count: 31,
      tags: ['GitHub', '评论'],
      content: `# Giscus 配置

在 \`.env\` 中设置：

\`\`\`
VITE_GISCUS_REPO=owner/repo
VITE_GISCUS_REPO_ID=...
VITE_GISCUS_CATEGORY_ID=...
\`\`\`

详情页底部会自动加载评论组件。`,
    },
    {
      slug: 'sql-like-search',
      title: '简单全文搜索实现',
      summary: '使用 SQL LIKE 在标题与正文中匹配关键词，适合中小型博客。',
      cover_image: 'https://picsum.photos/seed/faar6/800/450',
      category: '后端',
      published_at: '2025-12-08T11:00:00.000Z',
      view_count: 67,
      tags: ['SQLite', '搜索'],
      content: `# SQL LIKE 搜索

\`\`\`sql
SELECT * FROM articles
WHERE title LIKE '%关键词%' OR content LIKE '%关键词%'
ORDER BY published_at DESC
LIMIT 10 OFFSET 0;
\`\`\`

生产环境可升级为 FTS5 或 Elasticsearch。`,
    },
  ]

  for (const sample of samples) {
    const { tags, ...article } = sample
    const result = insertArticle.run(article)
    for (const tagName of tags) {
      insertTag.run(tagName)
      const tag = getTagId.get(tagName)
      linkTag.run(result.lastInsertRowid, tag.id)
    }
  }
}

export default db
