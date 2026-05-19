import client from './client'

export function fetchArticles(params = {}) {
  return client.get('/articles', { params }).then((r) => r.data)
}

export function fetchArticle(slug) {
  return client.get(`/articles/${slug}`).then((r) => r.data)
}

export function recordArticleView(id) {
  return client.post(`/articles/${id}/view`).then((r) => r.data)
}

export function fetchTags() {
  return client.get('/tags').then((r) => r.data)
}

export function fetchCategories() {
  return client.get('/categories').then((r) => r.data)
}

export function fetchArchives() {
  return client.get('/archives').then((r) => r.data)
}
