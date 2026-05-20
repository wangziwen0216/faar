import http from './http'
import { normalizeArticle, normalizePage, normalizeTag } from './transform'

function toQuery(params = {}) {
  const q = {}
  if (params.page) q.page = params.page
  if (params.pageSize) q.page_size = params.pageSize
  if (params.q) q.q = params.q
  if (params.tagId) q.tag_id = params.tagId
  if (params.year) q.year = params.year
  if (params.month) q.month = params.month
  return q
}

export function fetchArticles(params = {}) {
  const endpoint = params.q ? '/articles/search' : '/articles'
  return http.get(endpoint, { params: toQuery(params) }).then((r) => normalizePage(r.data))
}

export function fetchArticle(id) {
  return http.get(`/articles/${id}`).then((r) => normalizeArticle(r.data, { full: true }))
}

export function fetchTags() {
  return http.get('/tags').then((r) => (r.data || []).map(normalizeTag))
}

export async function fetchTagByName(name) {
  const tags = await fetchTags()
  return tags.find((t) => t.name === name) || null
}

export function fetchArchives() {
  return http.get('/articles/archive').then((r) => r.data || [])
}
