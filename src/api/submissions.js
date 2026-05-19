import client from './client'

export function submitArticle(data) {
  return client.post('/submissions', data).then((r) => r.data)
}
