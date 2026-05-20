import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '') || 'tag'
}

router.get('/', (_req, res) => {
  const tags = db
    .prepare(
      `SELECT t.id, t.name, t.slug, t.description, t.created_at AS createdAt, t.updated_at AS updatedAt,
              COUNT(at.article_id) as articleCount
       FROM tags t
       LEFT JOIN article_tags at ON at.tag_id = t.id
       GROUP BY t.id
       ORDER BY t.name ASC`,
    )
    .all()
  res.json(tags)
})

router.post('/', (req, res) => {
  const name = req.body.name?.trim()
  if (!name) {
    res.status(400).json({ message: '标签名不能为空' })
    return
  }
  const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(name)
  if (existing) {
    res.status(409).json({ message: '标签已存在' })
    return
  }
  const now = new Date().toISOString()
  const slug = slugify(name)
  const result = db
    .prepare(
      'INSERT INTO tags (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(name, slug, req.body.description?.trim() || null, now, now)
  res.status(201).json({ id: result.lastInsertRowid, name, slug })
})

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
  if (!tag) {
    res.status(404).json({ message: '标签不存在' })
    return
  }
  const name = req.body.name?.trim() || tag.name
  const now = new Date().toISOString()
  db.prepare('UPDATE tags SET name = ?, slug = ?, description = ?, updated_at = ? WHERE id = ?').run(
    name,
    slugify(name),
    req.body.description?.trim() ?? tag.description,
    now,
    id,
  )
  res.json({ id, name })
})

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const tag = db.prepare('SELECT id FROM tags WHERE id = ?').get(id)
  if (!tag) {
    res.status(404).json({ message: '标签不存在' })
    return
  }
  db.prepare('DELETE FROM article_tags WHERE tag_id = ?').run(id)
  db.prepare('DELETE FROM tags WHERE id = ?').run(id)
  res.json({ message: '已删除' })
})

export default router
