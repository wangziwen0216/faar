import { Router } from 'express'
import {
  verifyPassword,
  getUserByUsername,
  mapUser,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  isRefreshTokenValid,
  getUserById,
} from '../auth.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.post('/login', (req, res) => {
  const username = req.body.username?.trim()
  const password = req.body.password

  if (!username || !password) {
    res.status(400).json({ message: '请输入用户名和密码' })
    return
  }

  const user = getUserByUsername(username)
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ message: '用户名或密码错误' })
    return
  }

  const profile = mapUser(user)
  const accessToken = signAccessToken(profile)
  const refreshToken = signRefreshToken(profile)
  storeRefreshToken(user.id, refreshToken, { replace: true })

  res.json({ user: profile, accessToken, refreshToken })
})

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    res.status(400).json({ message: '缺少 refreshToken' })
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    if (payload.type !== 'refresh' || !isRefreshTokenValid(refreshToken)) {
      res.status(401).json({ message: 'Refresh Token 无效' })
      return
    }

    const user = getUserById(payload.sub)
    if (!user) {
      res.status(401).json({ message: '用户不存在' })
      return
    }

    const profile = mapUser(user)
    revokeRefreshToken(refreshToken)

    const newAccess = signAccessToken(profile)
    const newRefresh = signRefreshToken(profile)
    storeRefreshToken(user.id, newRefresh)

    res.json({ accessToken: newAccess, refreshToken: newRefresh, user: profile })
  } catch {
    res.status(401).json({ message: 'Refresh Token 已过期' })
  }
})

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) revokeRefreshToken(refreshToken)
  res.json({ message: '已登出' })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
