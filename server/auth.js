import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import db from './db.js'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me'
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m'
const REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10)

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES },
  )
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: `${REFRESH_EXPIRES_DAYS}d`,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET)
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function storeRefreshToken(userId, refreshToken, { replace = false } = {}) {
  const tokenHash = hashToken(refreshToken)
  const decoded = jwt.decode(refreshToken)
  const expiresAt = new Date(decoded.exp * 1000).toISOString()
  const now = new Date().toISOString()

  if (replace) {
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId)
  }

  db.prepare(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)`,
  ).run(userId, tokenHash, expiresAt, now)
}

export function revokeRefreshToken(refreshToken) {
  const tokenHash = hashToken(refreshToken)
  db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash)
}

export function isRefreshTokenValid(refreshToken) {
  const tokenHash = hashToken(refreshToken)
  const row = db.prepare('SELECT id FROM refresh_tokens WHERE token_hash = ?').get(tokenHash)
  return !!row
}

export function getUserById(id) {
  return db
    .prepare('SELECT id, username, nickname, email, avatar, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?')
    .get(id)
}

export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
}

export function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    avatar: row.avatar,
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
  }
}
