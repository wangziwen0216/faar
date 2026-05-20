import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  articleSelect,
  mapArticle,
  NOT_DELETED,
  createArticle,
  updateArticle,
  softDeleteArticle,
  getArticleById,
} from '../articleService.js'

const router = Router()
router.use(requireAuth)

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 10))
  const offset = (page - 1) * pageSize

  const conditions = []
  const params = {}

  if (req.query.includeDeleted !== '1') {
    conditions.push(NOT_DELETED)
  }

  const status = req.query.status
  if (status && status !== 'all') {
    conditions.push('a.status = @status')
    params.status = status
  }

  if (req.query.q) {
    conditions.push('(a.title LIKE @q OR a.content LIKE @q OR a.summary LIKE @q)')
    params.q = `%${req.query.q}%`
  }

  const where = conditions.length ? conditions.join(' AND ') : '1=1'
  const countSql = `SELECT COUNT(DISTINCT a.id) as total FROM articles a WHERE ${where}`
  const { total } = db.prepare(countSql).get(params)

  const rows = db
    .prepare(
      `${articleSelect(where)} ORDER BY COALESCE(a.updated_at, a.submitted_at, a.published_at) DESC LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit: pageSize, offset })

  res.json({
    items: rows.map((r) => mapArticle(r)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
})

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const article = getArticleById(id, { includeDeleted: req.query.includeDeleted === '1' })
  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  res.json(article)
})

router.post('/', (req, res) => {
  const error = validateArticleBody(req.body)
  if (error) {
    res.status(400).json({ message: error })
    return
  }

  const id = createArticle(req.body, req.user)
  const article = getArticleById(id)
  res.status(201).json(article)
})

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const error = validateArticleBody(req.body, { partial: false })
  if (error) {
    res.status(400).json({ message: error })
    return
  }

  const updated = updateArticle(id, req.body)
  if (!updated) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  res.json(getArticleById(id))
})

router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const updated = updateArticle(id, req.body)
  if (!updated) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  res.json(getArticleById(id))
})

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const ok = softDeleteArticle(id)
  if (!ok) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  res.json({ message: '已删除（软删除）' })
})

router.post('/:id/approve', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const article = db.prepare('SELECT id, status FROM articles WHERE id = ? AND deleted_at IS NULL').get(id)
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
    `UPDATE articles SET status = 'published', published_at = @now, reviewed_at = @now, review_note = NULL, updated_at = @now WHERE id = @id`,
  ).run({ id, now })
  res.json({ message: '已发布', article: getArticleById(id) })
})

router.post('/:id/reject', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const article = db.prepare('SELECT id, status FROM articles WHERE id = ? AND deleted_at IS NULL').get(id)
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
    `UPDATE articles SET status = 'rejected', reviewed_at = @now, review_note = @reviewNote, updated_at = @now WHERE id = @id`,
  ).run({ id, now, reviewNote })
  res.json({ message: '已驳回', article: getArticleById(id) })
})

function validateArticleBody(body, { partial = false } = {}) {
  if (!partial) {
    if (!body.title?.trim()) return '标题不能为空'
    if (!body.summary?.trim()) return '简介不能为空'
    if (!body.content?.trim()) return '正文不能为空'
    if (!body.category && !body.categoryId) return '请选择分类'
  }
  const status = body.status
  if (status && !['draft', 'published', 'pending'].includes(status)) {
    return '无效的状态'
  }
  return null
}

export default router
