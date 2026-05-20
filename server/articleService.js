import db from './db.js'
import { slugifyTitle, uniqueSlug, parseTags, linkArticleTags } from './articleHelpers.js'

export const PUBLISHED_FILTER = "a.status = 'published' AND a.deleted_at IS NULL"
export const NOT_DELETED = 'a.deleted_at IS NULL'

export function articleSelect(extraWhere = '') {
  const where = extraWhere ? `WHERE ${extraWhere}` : ''
  return `
    SELECT DISTINCT a.id, a.slug, a.title, a.summary, a.cover_image AS coverImage,
           COALESCE(c.name, a.category) AS category, a.category_id AS categoryId,
           a.published_at AS publishedAt, a.updated_at AS updatedAt,
           a.view_count AS viewCount, a.status,
           a.author_id AS authorId, a.author_name AS authorName, a.author_contact AS authorContact,
           a.submitted_at AS submittedAt, a.reviewed_at AS reviewedAt, a.review_note AS reviewNote,
           a.deleted_at AS deletedAt,
           GROUP_CONCAT(t.name) AS tagNames
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    LEFT JOIN article_tags at ON at.article_id = a.id
    LEFT JOIN tags t ON t.id = at.tag_id
    ${where}
    GROUP BY a.id
  `
}

export function mapArticle(row, { includeContent = false, content = null } = {}) {
  const article = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImage: row.coverImage,
    category: row.category,
    categoryId: row.categoryId,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    viewCount: row.viewCount,
    tags: row.tagNames ? row.tagNames.split(',') : [],
  }
  if (row.status !== undefined) {
    Object.assign(article, {
      status: row.status,
      authorId: row.authorId,
      authorName: row.authorName,
      authorContact: row.authorContact,
      submittedAt: row.submittedAt,
      reviewedAt: row.reviewedAt,
      reviewNote: row.reviewNote,
      deletedAt: row.deletedAt,
    })
  }
  if (includeContent) article.content = content
  return article
}

export function resolveCategoryId(categoryInput) {
  if (!categoryInput) return null
  if (typeof categoryInput === 'number') return categoryInput
  const str = String(categoryInput).trim()
  const byId = parseInt(str, 10)
  if (!Number.isNaN(byId) && db.prepare('SELECT id FROM categories WHERE id = ?').get(byId)) {
    return byId
  }
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(str)
  if (existing) return existing.id
  const now = new Date().toISOString()
  const slug = str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '') || 'cat'
  const result = db
    .prepare(
      'INSERT INTO categories (name, slug, created_at, updated_at) VALUES (?, ?, ?, ?)',
    )
    .run(str, slug, now, now)
  return result.lastInsertRowid
}

export function getCategoryName(categoryId, fallback) {
  if (!categoryId) return fallback || ''
  const row = db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId)
  return row?.name || fallback || ''
}

export function createArticle(data, user) {
  const slug = uniqueSlug(slugifyTitle(data.title))
  const tags = parseTags(data.tags)
  const now = new Date().toISOString()
  const status = data.status || 'draft'
  const categoryId = resolveCategoryId(data.categoryId || data.category)
  const categoryName = getCategoryName(categoryId, data.category)

  const result = db
    .prepare(
      `INSERT INTO articles (
        slug, title, summary, cover_image, content, category, category_id,
        published_at, view_count, status, author_id, author_name,
        submitted_at, updated_at
      ) VALUES (
        @slug, @title, @summary, @cover_image, @content, @category, @category_id,
        @published_at, 0, @status, @author_id, @author_name,
        NULL, @updated_at
      )`,
    )
    .run({
      slug,
      title: data.title.trim(),
      summary: data.summary.trim(),
      cover_image: data.coverImage?.trim() || null,
      content: data.content.trim(),
      category: categoryName,
      category_id: categoryId,
      published_at: status === 'published' ? now : null,
      status,
      author_id: user?.id || null,
      author_name: user?.nickname || user?.username || data.authorName,
      updated_at: now,
    })

  linkArticleTags(result.lastInsertRowid, tags)
  return result.lastInsertRowid
}

export function updateArticle(id, data) {
  const article = db.prepare('SELECT * FROM articles WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!article) return null

  const now = new Date().toISOString()
  const status = data.status ?? article.status
  const categoryId =
    data.categoryId !== undefined || data.category !== undefined
      ? resolveCategoryId(data.categoryId || data.category)
      : article.category_id
  const categoryName = getCategoryName(categoryId, data.category || article.category)

  let publishedAt = article.published_at
  if (status === 'published' && !publishedAt) publishedAt = now

  db.prepare(
    `UPDATE articles SET
      title = @title, summary = @summary, cover_image = @cover_image, content = @content,
      category = @category, category_id = @category_id, status = @status,
      published_at = @published_at, updated_at = @updated_at
     WHERE id = @id`,
  ).run({
    id,
    title: (data.title ?? article.title).trim(),
    summary: (data.summary ?? article.summary).trim(),
    cover_image: data.coverImage !== undefined ? data.coverImage?.trim() || null : article.cover_image,
    content: (data.content ?? article.content).trim(),
    category: categoryName,
    category_id: categoryId,
    status,
    published_at: publishedAt,
    updated_at: now,
  })

  if (data.tags !== undefined) {
    linkArticleTags(id, parseTags(data.tags))
  }

  return id
}

export function softDeleteArticle(id) {
  const now = new Date().toISOString()
  const result = db
    .prepare("UPDATE articles SET deleted_at = @now, updated_at = @now WHERE id = @id AND deleted_at IS NULL")
    .run({ id, now })
  return result.changes > 0
}

export function getArticleById(id, { includeDeleted = false } = {}) {
  const cond = includeDeleted ? 'a.id = @id' : `${NOT_DELETED} AND a.id = @id`
  const row = db.prepare(articleSelect(cond)).get({ id })
  if (!row) return null
  const contentRow = db.prepare('SELECT content FROM articles WHERE id = ?').get(id)
  return mapArticle(row, { includeContent: true, content: contentRow?.content })
}
