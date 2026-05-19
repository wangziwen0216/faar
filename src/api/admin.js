import axios from 'axios'
import { getAdminToken } from '../utils/adminAuth'

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

adminClient.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function fetchAdminArticles(params = {}) {
  return adminClient.get('/admin/articles', { params }).then((r) => r.data)
}

export function fetchAdminArticle(id) {
  return adminClient.get(`/admin/articles/${id}`).then((r) => r.data)
}

export function approveArticle(id) {
  return adminClient.post(`/admin/articles/${id}/approve`).then((r) => r.data)
}

export function rejectArticle(id, reviewNote) {
  return adminClient.post(`/admin/articles/${id}/reject`, { reviewNote }).then((r) => r.data)
}
