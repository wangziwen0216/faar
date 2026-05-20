import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 15000,
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body.code === 'number') {
      if (body.code !== 0) {
        const err = new Error(body.message || '请求失败')
        err.response = res
        return Promise.reject(err)
      }
      res.data = body.data
    }
    return res
  },
  (error) => {
    const msg = error.response?.data?.message
    if (msg) error.message = msg
    return Promise.reject(error)
  },
)

export default http
