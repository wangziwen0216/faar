import Redis from 'ioredis'
import { createHash } from 'crypto'

let redis = null
const memoryStore = new Map()

const PV_TTL_SECONDS = 3600

export async function initRedis() {
  const url = process.env.REDIS_URL
  if (!url) {
    console.log('[pv] REDIS_URL 未配置，使用内存防刷（开发环境）')
    return null
  }
  try {
    redis = new Redis(url)
    await redis.ping()
    console.log('[pv] Redis 已连接')
    return redis
  } catch (err) {
    console.warn('[pv] Redis 连接失败，回退内存模式:', err.message)
    redis = null
    return null
  }
}

export function visitorFingerprint(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  const ua = req.get('user-agent') || ''
  return createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16)
}

export async function shouldCountView(articleId, fingerprint) {
  const key = `pv:${articleId}:${fingerprint}`

  if (redis) {
    const result = await redis.set(key, '1', 'EX', PV_TTL_SECONDS, 'NX')
    return result === 'OK'
  }

  const now = Date.now()
  const existing = memoryStore.get(key)
  if (existing && now - existing < PV_TTL_SECONDS * 1000) {
    return false
  }
  memoryStore.set(key, now)
  return true
}
