import db from './db.js'

export function slugifyTitle(title) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .slice(0, 60)
  const suffix = Date.now().toString(36)
  return `${base || 'post'}-${suffix}`
}

export function uniqueSlug(baseSlug) {
  let slug = baseSlug
  let n = 1
  while (db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug)) {
    slug = `${baseSlug}-${n}`
    n += 1
  }
  return slug
}

export function parseTags(input) {
  if (!input) return []
  const raw = Array.isArray(input) ? input : String(input).split(/[,，]/)
  return [...new Set(raw.map((t) => t.trim()).filter(Boolean))].slice(0, 10)
}

export function linkArticleTags(articleId, tagNames) {
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?')
  const linkTag = db.prepare(
    'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
  )
  const clearTags = db.prepare('DELETE FROM article_tags WHERE article_id = ?')

  clearTags.run(articleId)
  for (const name of tagNames) {
    insertTag.run(name)
    const tag = getTagId.get(name)
    linkTag.run(articleId, tag.id)
  }
}

export const PUBLISHED_FILTER = "a.status = 'published'"
