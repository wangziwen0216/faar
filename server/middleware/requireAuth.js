import { verifyAccessToken, getUserById, mapUser } from '../auth.js'

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({ message: '请先登录' })
    return
  }

  try {
    const payload = verifyAccessToken(token)
    if (payload.type !== 'access') {
      res.status(401).json({ message: '无效的令牌' })
      return
    }
    const user = getUserById(payload.sub)
    if (!user) {
      res.status(401).json({ message: '用户不存在' })
      return
    }
    req.user = mapUser(user)
    next()
  } catch {
    res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}
