import express from 'express'
import cors from 'cors'
import db from './db.js'
import { initRedis, shouldCountView, visitorFingerprint } from './redis.js'
import { requireAdmin } from './adminAuth.js'
import { slugifyTitle, uniqueSlug, parseTags, linkArticleTags } from './articleHelpers.js'
import {
  PUBLISHED_FILTER,
  NOT_DELETED,
  articleSelect,
  mapArticle,
  getArticleById,
} from './articleService.js'
import authRoutes from './routes/authRoutes.js'
import manageArticles from './routes/manageArticles.js'
import manageTags from './routes/manageTags.js'
import manageCategories from './routes/manageCategories.js'
import manageProfile from './routes/manageProfile.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.set('trust proxy', true)

function validateSubmission(body) {
  const title = body.title?.trim()
  const summary = body.summary?.trim()
  const content = body.content?.trim()
  const category = body.category?.trim()
  const authorName = body.authorName?.trim()

  if (!title || title.length < 2) return '标题至少 2 个字符'
  if (!summary || summary.length < 10) return '简介至少 10 个字符'
  if (!content || content.length < 20) return '正文至少 20 个字符'
  if (!category) return '请选择分类'
  if (!authorName) return '请填写作者昵称'
  return null
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/manage/articles', manageArticles)
app.use('/api/manage/tags', manageTags)
app.use('/api/manage/categories', manageCategories)
app.use('/api/manage/profile', manageProfile)

app.get('/api/articles', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 10))
  const offset = (page - 1) * pageSize

  const conditions = [PUBLISHED_FILTER]
  const params = {}

  if (req.query.tag) {
    conditions.push(`EXISTS (
      SELECT 1 FROM article_tags at2
      JOIN tags t2 ON t2.id = at2.tag_id
      WHERE at2.article_id = a.id AND t2.name = @tag
    )`)
    params.tag = req.query.tag
  }

  if (req.query.category) {
    conditions.push('(c.name = @category OR a.category = @category)')
    params.category = req.query.category
  }

  if (req.query.q) {
    conditions.push('(a.title LIKE @q OR a.content LIKE @q OR a.summary LIKE @q)')
    params.q = `%${req.query.q}%`
  }

  if (req.query.year) {
    conditions.push("strftime('%Y', a.published_at) = @year")
    params.year = String(req.query.year)
  }

  if (req.query.month) {
    conditions.push("strftime('%m', a.published_at) = @month")
    params.month = String(req.query.month).padStart(2, '0')
  }

  const where = conditions.join(' AND ')
  const { total } = db.prepare(`SELECT COUNT(DISTINCT a.id) as total FROM articles a LEFT JOIN categories c ON c.id = a.category_id WHERE ${where}`).get(params)
  const rows = db
    .prepare(`${articleSelect(where)} ORDER BY a.published_at DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: pageSize, offset })

  res.json({ items: rows.map((r) => mapArticle(r)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
})

app.get('/api/articles/:slug', (req, res) => {
  const row = db.prepare(`${articleSelect(`${PUBLISHED_FILTER} AND a.slug = @slug`)}`).get({ slug: req.params.slug })
  if (!row) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  const contentRow = db.prepare("SELECT content FROM articles WHERE slug = ? AND status = 'published' AND deleted_at IS NULL").get(req.params.slug)
  res.json(mapArticle(row, { includeContent: true, content: contentRow.content }))
})

app.post('/api/articles/:id/view', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const article = db.prepare("SELECT id, view_count FROM articles WHERE id = ? AND status = 'published' AND deleted_at IS NULL").get(id)
  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  const fingerprint = visitorFingerprint(req)
  const count = await shouldCountView(id, fingerprint)
  if (count) db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(id)
  const updated = db.prepare('SELECT view_count FROM articles WHERE id = ?').get(id)
  res.json({ viewCount: updated.view_count, counted: count })
})

app.post('/api/submissions', (req, res) => {
  const error = validateSubmission(req.body)
  if (error) {
    res.status(400).json({ message: error })
    return
  }
  const slug = uniqueSlug(slugifyTitle(req.body.title))
  const tags = parseTags(req.body.tags)
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO articles (slug, title, summary, cover_image, content, category, published_at, view_count, status, author_name, author_contact, submitted_at, updated_at)
       VALUES (@slug, @title, @summary, @cover_image, @content, @category, NULL, 0, 'pending', @author_name, @author_contact, @submitted_at, @updated_at)`,
    )
    .run({
      slug,
      title: req.body.title.trim(),
      summary: req.body.summary.trim(),
      cover_image: req.body.coverImage?.trim() || null,
      content: req.body.content.trim(),
      category: req.body.category.trim(),
      author_name: req.body.authorName.trim(),
      author_contact: req.body.authorContact?.trim() || null,
      submitted_at: now,
      updated_at: now,
    })
  linkArticleTags(result.lastInsertRowid, tags)
  res.status(201).json({ id: result.lastInsertRowid, slug, message: '投稿成功，审核通过后将公开展示' })
})

app.get('/api/tags', (_req, res) => {
  const tags = db
    .prepare(
      `SELECT t.name, COUNT(at.article_id) as count FROM tags t
       INNER JOIN article_tags at ON at.tag_id = t.id
       INNER JOIN articles a ON a.id = at.article_id AND a.status = 'published' AND a.deleted_at IS NULL
       GROUP BY t.id ORDER BY count DESC, t.name ASC`,
    )
    .all()
  res.json(tags)
})

app.get('/api/categories', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.name, COUNT(a.id) as count FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published' AND a.deleted_at IS NULL
       GROUP BY c.id ORDER BY count DESC, c.name ASC`,
    )
    .all()
  if (categories.length === 0) {
    const fallback = db
      .prepare(
        `SELECT category as name, COUNT(*) as count FROM articles WHERE status = 'published' AND deleted_at IS NULL GROUP BY category ORDER BY count DESC`,
      )
      .all()
    res.json(fallback)
    return
  }
  res.json(categories)
})

app.get('/api/archives', (_req, res) => {
  const archives = db
    .prepare(
      `SELECT strftime('%Y', published_at) as year, strftime('%m', published_at) as month, COUNT(*) as count
       FROM articles WHERE status = 'published' AND published_at IS NOT NULL AND deleted_at IS NULL
       GROUP BY year, month ORDER BY year DESC, month DESC`,
    )
    .all()
  res.json(archives)
})

app.get('/api/admin/articles', requireAdmin, (req, res) => {
  const status = req.query.status || 'pending'
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 10))
  const offset = (page - 1) * pageSize
  const where = status === 'all' ? NOT_DELETED : `${NOT_DELETED} AND a.status = @status`
  const params = status === 'all' ? {} : { status }
  const { total } = db.prepare(`SELECT COUNT(DISTINCT a.id) as total FROM articles a WHERE ${where}`).get(params)
  const rows = db
    .prepare(`${articleSelect(where)} ORDER BY COALESCE(a.updated_at, a.submitted_at, a.published_at) DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: pageSize, offset })
  res.json({ items: rows.map((r) => mapArticle(r)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
})

app.get('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const article = getArticleById(parseInt(req.params.id, 10))
  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  res.json(article)
})

await initRedis()

app.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`)
})
