import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { hashPassword, verifyPassword, mapUser } from '../auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', (req, res) => {
  res.json(req.user)
})

router.patch('/', (req, res) => {
  const { nickname, email, avatar, currentPassword, newPassword } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const now = new Date().toISOString()

  if (newPassword) {
    if (!currentPassword || !verifyPassword(currentPassword, user.password_hash)) {
      res.status(400).json({ message: '当前密码不正确' })
      return
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: '新密码至少 6 位' })
      return
    }
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      hashPassword(newPassword),
      now,
      req.user.id,
    )
  }

  db.prepare(
    `UPDATE users SET
      nickname = COALESCE(@nickname, nickname),
      email = COALESCE(@email, email),
      avatar = COALESCE(@avatar, avatar),
      updated_at = @now
     WHERE id = @id`,
  ).run({
    id: req.user.id,
    nickname: nickname?.trim() ?? null,
    email: email?.trim() ?? null,
    avatar: avatar?.trim() ?? null,
    now,
  })

  const updated = db
    .prepare(
      'SELECT id, username, nickname, email, avatar, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?',
    )
    .get(req.user.id)
  res.json(mapUser(updated))
})

export default router
