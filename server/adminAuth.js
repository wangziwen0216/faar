const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token'

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.get('x-admin-token')

  if (!token || token !== ADMIN_TOKEN) {
    res.status(401).json({ message: '需要管理员令牌' })
    return
  }

  next()
}
