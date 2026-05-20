import http from './http'
import { setTokens, clearTokens } from './authClient'

export function login(phone, password) {
  return http.post('/auth/login', { phone, password }).then((r) => {
    const { tokens, user } = r.data
    setTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    })
    return {
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    }
  })
}

export function logout() {
  return http.post('/auth/logout').finally(() => clearTokens())
}

export function fetchMe() {
  return http.get('/admin/profile').then((r) => ({
    id: r.data.id,
    username: r.data.phone,
    phone: r.data.phone,
    nickname: r.data.nickname,
    email: r.data.email,
    avatar: r.data.avatar,
    createdAt: r.data.created_at,
    updatedAt: r.data.updated_at,
  }))
}
