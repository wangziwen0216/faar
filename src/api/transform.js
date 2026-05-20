export const ARTICLE_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
}

export function statusToApi(status) {
  if (status === 'published' || status === 1 || status === '1') return ARTICLE_STATUS.PUBLISHED
  return ARTICLE_STATUS.DRAFT
}

export function statusFromApi(status) {
  return status === ARTICLE_STATUS.PUBLISHED ? 'published' : 'draft'
}

export function normalizeTag(tag) {
  if (!tag) return null
  if (typeof tag === 'string') return { id: tag, name: tag }
  return {
    id: tag.id,
    name: tag.name,
    articleCount: tag.article_count ?? tag.articleCount,
  }
}

export function normalizeArticle(item, { full = false } = {}) {
  if (!item) return null
  const tags = (item.tags || []).map((t) => (typeof t === 'object' ? t.name : t))
  const tagIds = (item.tags || []).map((t) => (typeof t === 'object' ? t.id : null)).filter(Boolean)

  const base = {
    id: item.id,
    title: item.title,
    summary: item.summary || '',
    coverImage: item.cover_url || item.coverImage || '',
    cover_url: item.cover_url || item.coverImage || '',
    viewCount: item.view_count ?? item.viewCount ?? 0,
    publishedAt: item.published_at || item.publishedAt,
    updatedAt: item.updated_at || item.updatedAt,
    status: statusFromApi(item.status),
    statusCode: item.status,
    tags,
    tagIds,
  }

  if (full) {
    base.content = item.content || ''
  }

  return base
}

export function normalizePage(data, { fullItems = false } = {}) {
  const list = data?.list || data?.items || []
  return {
    items: list.map((item) => normalizeArticle(item, { full: fullItems })),
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.page_size ?? data?.pageSize ?? 10,
    totalPages: Math.ceil((data?.total ?? 0) / (data?.page_size ?? data?.pageSize ?? 10)) || 1,
  }
}

export function toSaveArticlePayload(form, allTags = []) {
  const tagIds = resolveTagIds(form.tags, allTags)
  return {
    title: form.title.trim(),
    summary: form.summary.trim(),
    content: form.content.trim(),
    cover_url: form.coverImage?.trim() || '',
    status: statusToApi(form.status),
    tag_ids: tagIds,
  }
}

function resolveTagIds(tagsInput, allTags) {
  if (!tagsInput) return []
  const names = String(tagsInput)
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const ids = []
  for (const name of names) {
    const found = allTags.find((t) => t.name === name)
    if (found?.id) ids.push(found.id)
  }
  return ids
}
