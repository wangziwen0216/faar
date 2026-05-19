import express from 'express'
import cors from 'cors'
import db from './db.js'
import { initRedis, shouldCountView, visitorFingerprint } from './redis.js'
import { requireAdmin } from './adminAuth.js'
import {
  PUBLISHED_FILTER,
  slugifyTitle,
  uniqueSlug,
  parseTags,
  linkArticleTags,
} from './articleHelpers.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.set('trust proxy', true)

function articleSelect(extraWhere = '') {
  const where = extraWhere ? `WHERE ${extraWhere}` : ''
  return `
    SELECT DISTINCT a.id, a.slug, a.title, a.summary, a.cover_image AS coverImage,
           a.category, a.published_at AS publishedAt, a.view_count AS viewCount,
           a.status, a.author_name AS authorName, a.author_contact AS authorContact,
           a.submitted_at AS submittedAt, a.reviewed_at AS reviewedAt, a.review_note AS reviewNote,
           GROUP_CONCAT(t.name) AS tagNames
    FROM articles a
    LEFT JOIN article_tags at ON at.article_id = a.id
    LEFT JOIN tags t ON t.id = at.tag_id
    ${where}
    GROUP BY a.id
  `
}

function mapArticle(row, { includeContent = false, content = null } = {}) {
  const article = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImage: row.coverImage,
    category: row.category,
    publishedAt: row.publishedAt,
    viewCount: row.viewCount,
    tags: row.tagNames ? row.tagNames.split(',') : [],
  }
  if (row.status !== undefined) {
    article.status = row.status
    article.authorName = row.authorName
    article.authorContact = row.authorContact
    article.submittedAt = row.submittedAt
    article.reviewedAt = row.reviewedAt
    article.reviewNote = row.reviewNote
  }
  if (includeContent) article.content = content
  return article
}

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
    conditions.push('a.category = @category')
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

  const countSql = `SELECT COUNT(DISTINCT a.id) as total FROM articles a WHERE ${where}`
  const { total } = db.prepare(countSql).get(params)

  const listSql = `
    ${articleSelect(where)}
    ORDER BY a.published_at DESC
    LIMIT @limit OFFSET @offset
  `
  const rows = db.prepare(listSql).all({ ...params, limit: pageSize, offset })
  const items = rows.map((row) => mapArticle(row))

  res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
})

app.get('/api/articles/:slug', (req, res) => {
  const row = db
    .prepare(`${articleSelect(`${PUBLISHED_FILTER} AND a.slug = @slug`)}`)
    .get({ slug: req.params.slug })

  if (!row) {
    res.status(404).json({ message: '文章不存在' })
    return
  }

  const contentRow = db
    .prepare("SELECT content FROM articles WHERE slug = ? AND status = 'published'")
    .get(req.params.slug)

  res.json(mapArticle(row, { includeContent: true, content: contentRow.content }))
})

app.post('/api/articles/:id/view', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const article = db
    .prepare("SELECT id, view_count FROM articles WHERE id = ? AND status = 'published'")
    .get(id)

  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }

  const fingerprint = visitorFingerprint(req)
  const count = await shouldCountView(id, fingerprint)

  if (count) {
    db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(id)
  }

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
      `INSERT INTO articles (
        slug, title, summary, cover_image, content, category,
        published_at, view_count, status, author_name, author_contact, submitted_at
      ) VALUES (
        @slug, @title, @summary, @cover_image, @content, @category,
        NULL, 0, 'pending', @author_name, @author_contact, @submitted_at
      )`,
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
    })

  linkArticleTags(result.lastInsertRowid, tags)

  res.status(201).json({
    id: result.lastInsertRowid,
    slug,
    message: '投稿成功，审核通过后将公开展示',
  })
})

app.get('/api/admin/articles', requireAdmin, (req, res) => {
  const status = req.query.status || 'pending'
  const allowed = ['pending', 'published', 'rejected', 'all']
  if (!allowed.includes(status)) {
    res.status(400).json({ message: '无效的状态' })
    return
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 10))
  const offset = (page - 1) * pageSize

  const where = status === 'all' ? '1=1' : 'a.status = @status'
  const params = status === 'all' ? {} : { status }

  const countSql = `SELECT COUNT(DISTINCT a.id) as total FROM articles a WHERE ${where}`
  const { total } = db.prepare(countSql).get(params)

  const listSql = `
    ${articleSelect(where)}
    ORDER BY COALESCE(a.submitted_at, a.published_at) DESC
    LIMIT @limit OFFSET @offset
  `
  const rows = db.prepare(listSql).all({ ...params, limit: pageSize, offset })

  res.json({
    items: rows.map((row) => mapArticle(row)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
})

app.get('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const row = db.prepare(`${articleSelect('a.id = @id')}`).get({ id })

  if (!row) {
    res.status(404).json({ message: '文章不存在' })
    return
  }

  const contentRow = db.prepare('SELECT content FROM articles WHERE id = ?').get(id)
  res.json(mapArticle(row, { includeContent: true, content: contentRow.content }))
})

app.post('/api/admin/articles/:id/approve', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const article = db.prepare('SELECT id, status FROM articles WHERE id = ?').get(id)

  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }

  if (article.status !== 'pending') {
    res.status(400).json({ message: '只能审核待审核文章' })
    return
  }

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE articles SET status = 'published', published_at = @now, reviewed_at = @now, review_note = NULL
     WHERE id = @id`,
  ).run({ id, now })

  const row = db.prepare(`${articleSelect('a.id = @id')}`).get({ id })
  res.json({ message: '已发布', article: mapArticle(row) })
})

app.post('/api/admin/articles/:id/reject', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10)
  const article = db.prepare('SELECT id, status FROM articles WHERE id = ?').get(id)

  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }

  if (article.status !== 'pending') {
    res.status(400).json({ message: '只能审核待审核文章' })
    return
  }

  const now = new Date().toISOString()
  const reviewNote = req.body.reviewNote?.trim() || '未通过审核'

  db.prepare(
    `UPDATE articles SET status = 'rejected', reviewed_at = @now, review_note = @reviewNote
     WHERE id = @id`,
  ).run({ id, now, reviewNote })

  const row = db.prepare(`${articleSelect('a.id = @id')}`).get({ id })
  res.json({ message: '已驳回', article: mapArticle(row) })
})

app.get('/api/tags', (_req, res) => {
  const tags = db
    .prepare(
      `SELECT t.name, COUNT(at.article_id) as count
       FROM tags t
       INNER JOIN article_tags at ON at.tag_id = t.id
       INNER JOIN articles a ON a.id = at.article_id AND a.status = 'published'
       GROUP BY t.id
       ORDER BY count DESC, t.name ASC`,
    )
    .all()
  res.json(tags)
})

app.get('/api/categories', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT category as name, COUNT(*) as count
       FROM articles
       WHERE status = 'published'
       GROUP BY category
       ORDER BY count DESC`,
    )
    .all()
  res.json(categories)
})

app.get('/api/archives', (_req, res) => {
  const archives = db
    .prepare(
      `SELECT strftime('%Y', published_at) as year,
              strftime('%m', published_at) as month,
              COUNT(*) as count
       FROM articles
       WHERE status = 'published' AND published_at IS NOT NULL
       GROUP BY year, month
       ORDER BY year DESC, month DESC`,
    )
    .all()
  res.json(archives)
})

await initRedis()

app.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`)
  if (!process.env.ADMIN_TOKEN) {
    console.log('[admin] 未设置 ADMIN_TOKEN，使用默认开发令牌: dev-admin-token')
  }
})
