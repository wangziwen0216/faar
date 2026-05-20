import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '') || 'category'
}

router.get('/', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.description, c.created_at AS createdAt, c.updated_at AS updatedAt,
              COUNT(a.id) as articleCount
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id AND a.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.name ASC`,
    )
    .all()
  res.json(categories)
})

router.post('/', (req, res) => {
  const name = req.body.name?.trim()
  if (!name) {
    res.status(400).json({ message: '分类名不能为空' })
    return
  }
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name)
  if (existing) {
    res.status(409).json({ message: '分类已存在' })
    return
  }
  const now = new Date().toISOString()
  const result = db
    .prepare(
      'INSERT INTO categories (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(name, slugify(name), req.body.description?.trim() || null, now, now)
  res.status(201).json({ id: result.lastInsertRowid, name })
})

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  if (!cat) {
    res.status(404).json({ message: '分类不存在' })
    return
  }
  const name = req.body.name?.trim() || cat.name
  const now = new Date().toISOString()
  db.prepare('UPDATE categories SET name = ?, slug = ?, description = ?, updated_at = ? WHERE id = ?').run(
    name,
    slugify(name),
    req.body.description?.trim() ?? cat.description,
    now,
    id,
  )
  db.prepare('UPDATE articles SET category = ? WHERE category_id = ?').run(name, id)
  res.json({ id, name })
})

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(id)
  if (!cat) {
    res.status(404).json({ message: '分类不存在' })
    return
  }
  const used = db.prepare('SELECT COUNT(*) as c FROM articles WHERE category_id = ? AND deleted_at IS NULL').get(id)
  if (used.c > 0) {
    res.status(400).json({ message: '该分类下仍有文章，无法删除' })
    return
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  res.json({ message: '已删除' })
})

export default router
