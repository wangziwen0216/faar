import http from './http'
import { normalizeArticle, normalizePage, normalizeTag, statusToApi, toSaveArticlePayload } from './transform'

function adminQuery(params = {}) {
  const q = {}
  if (params.page) q.page = params.page
  if (params.pageSize) q.page_size = params.pageSize
  if (params.q) q.q = params.q
  if (params.status !== undefined && params.status !== 'all') {
    q.status = statusToApi(params.status)
  }
  return q
}

export function fetchManageArticles(params = {}) {
  return http.get('/admin/articles', { params: adminQuery(params) }).then((r) => normalizePage(r.data))
}

export function fetchManageArticle(id) {
  return http.get(`/admin/articles/${id}`).then((r) => normalizeArticle(r.data, { full: true }))
}

export async function createArticle(form, allTags = []) {
  const payload = toSaveArticlePayload(form, allTags)
  const data = await http.post('/admin/articles', payload).then((r) => r.data)
  return normalizeArticle(data, { full: true })
}

export async function updateArticle(id, form, allTags = []) {
  const payload = toSaveArticlePayload(form, allTags)
  const data = await http.put(`/admin/articles/${id}`, payload).then((r) => r.data)
  return normalizeArticle(data, { full: true })
}

export function deleteArticle(id) {
  return http.delete(`/admin/articles/${id}`).then((r) => r.data)
}

export function fetchManageTags() {
  return http.get('/admin/tags').then((r) => (r.data || []).map(normalizeTag))
}

export function createTag(data) {
  return http.post('/admin/tags', { name: data.name }).then((r) => normalizeTag(r.data))
}

export function updateTag(id, data) {
  return http.put(`/admin/tags/${id}`, { name: data.name }).then((r) => normalizeTag(r.data))
}

export function deleteTag(id) {
  return http.delete(`/admin/tags/${id}`).then((r) => r.data)
}

export function fetchProfile() {
  return http.get('/admin/profile').then((r) => ({
    id: r.data.id,
    phone: r.data.phone,
    nickname: r.data.nickname,
    email: r.data.email,
    avatar: r.data.avatar,
    createdAt: r.data.created_at,
    updatedAt: r.data.updated_at,
  }))
}

export function updateProfile(data) {
  return http
    .put('/admin/profile', {
      nickname: data.nickname,
      email: data.email,
      avatar: data.avatar,
    })
    .then((r) => ({
      id: r.data.id,
      phone: r.data.phone,
      nickname: r.data.nickname,
      email: r.data.email,
      avatar: r.data.avatar,
      createdAt: r.data.created_at,
      updatedAt: r.data.updated_at,
    }))
}
