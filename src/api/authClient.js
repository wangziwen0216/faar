import axios from 'axios'
import http from './http'

const ACCESS_KEY = 'faar_access_token'
const REFRESH_KEY = 'faar_refresh_token'

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY) || ''
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || ''
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) sessionStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = null

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      return Promise.reject(error)
    }

    if (!refreshing) {
      const baseURL = import.meta.env.VITE_API_BASE || '/api/v1'
      refreshing = axios
        .post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken })
        .then((res) => {
          const body = res.data
          const data = body.code === 0 ? body.data : body
          setTokens({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          })
          return data.access_token
        })
        .catch((err) => {
          clearTokens()
          throw err
        })
        .finally(() => {
          refreshing = null
        })
    }

    try {
      original._retry = true
      const accessToken = await refreshing
      original.headers.Authorization = `Bearer ${accessToken}`
      return http(original)
    } catch (err) {
      return Promise.reject(err)
    }
  },
)

export default http
