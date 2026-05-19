import { useCallback, useEffect, useState } from 'react'
import { formatDateTime } from '../utils/date'
import { getAdminToken, setAdminToken, clearAdminToken } from '../utils/adminAuth'
import {
  fetchAdminArticles,
  fetchAdminArticle,
  approveArticle,
  rejectArticle,
} from '../api/admin'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import MarkdownRenderer from '../components/MarkdownRenderer'
import TagBadge from '../components/TagBadge'

const STATUS_TABS = [
  { key: 'pending', label: '待审核' },
  { key: 'published', label: '已发布' },
  { key: 'rejected', label: '已驳回' },
]

export default function AdminReviewPage() {
  const [tokenInput, setTokenInput] = useState(getAdminToken())
  const [authed, setAuthed] = useState(!!getAdminToken())
  const [status, setStatus] = useState('pending')
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [acting, setActing] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const data = await fetchAdminArticles({ status, pageSize: 50 })
      setList(data)
      if (data.items.length && !selectedId) {
        setSelectedId(data.items[0].id)
      } else if (!data.items.length) {
        setSelectedId(null)
        setDetail(null)
      }
    } catch (err) {
      if (err.response?.status === 401) {
        clearAdminToken()
        setAuthed(false)
        setListError({ message: '令牌无效，请重新登录' })
      } else {
        setListError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (!authed) return undefined
    loadList()
  }, [authed, status, loadList])

  useEffect(() => {
    if (!authed || !selectedId) return undefined
    let cancelled = false
    setDetailLoading(true)
    fetchAdminArticle(selectedId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authed, selectedId])

  function handleLogin(e) {
    e.preventDefault()
    setAdminToken(tokenInput.trim())
    setAuthed(true)
    setListError(null)
  }

  function handleLogout() {
    clearAdminToken()
    setAuthed(false)
    setList(null)
    setDetail(null)
    setSelectedId(null)
  }

  async function handleApprove() {
    if (!selectedId) return
    setActing(true)
    setActionMsg('')
    try {
      await approveArticle(selectedId)
      setActionMsg('已发布')
      setShowReject(false)
      await loadList()
      const next = list?.items.find((a) => a.id !== selectedId && a.status === 'pending')
      setSelectedId(next?.id ?? null)
    } catch (err) {
      setActionMsg(err.response?.data?.message || '操作失败')
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    if (!selectedId) return
    setActing(true)
    setActionMsg('')
    try {
      await rejectArticle(selectedId, rejectNote)
      setActionMsg('已驳回')
      setShowReject(false)
      setRejectNote('')
      await loadList()
      const next = list?.items.find((a) => a.id !== selectedId && a.status === 'pending')
      setSelectedId(next?.id ?? null)
    } catch (err) {
      setActionMsg(err.response?.data?.message || '操作失败')
    } finally {
      setActing(false)
    }
  }

  if (!authed) {
    return (
      <section className="admin-login">
        <header className="page-header">
          <h1>后台审核</h1>
          <p>请输入管理员令牌（与服务端 <code>ADMIN_TOKEN</code> 一致）</p>
        </header>
        <form className="admin-login-form" onSubmit={handleLogin}>
          <label>
            管理员令牌
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ADMIN_TOKEN"
              required
            />
          </label>
          {listError && <p className="form-error">{listError.message}</p>}
          <button type="submit" className="btn-primary">
            进入后台
          </button>
          <p className="form-hint">开发环境默认令牌：<code>dev-admin-token</code></p>
        </form>
      </section>
    )
  }

  return (
    <section className="admin-panel">
      <header className="page-header admin-header">
        <div>
          <h1>后台审核</h1>
          <p>审核用户投稿，通过后文章将出现在前台列表</p>
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={handleLogout}>
          退出登录
        </button>
      </header>

      <div className="admin-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={status === tab.key ? 'active' : ''}
            onClick={() => {
              setStatus(tab.key)
              setSelectedId(null)
              setDetail(null)
            }}
          >
            {tab.label}
            {tab.key === 'pending' && list?.items && status === 'pending' && (
              <span className="badge">{list.total}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <Loading />}
      {listError && !loading && <ErrorMessage message={listError.message} />}

      {!loading && list && (
        <div className="admin-layout">
          <ul className="admin-list">
            {list.items.length === 0 ? (
              <li className="empty-state">暂无文章</li>
            ) : (
              list.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`admin-list-item${selectedId === item.id ? ' active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="admin-list-title">{item.title}</span>
                    <span className="admin-list-meta">
                      {item.authorName || '匿名'} · {formatDateTime(item.submittedAt || item.publishedAt)}
                    </span>
                    <span className={`status-pill status-${item.status}`}>{statusLabel(item.status)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="admin-detail">
            {!selectedId && <p className="empty-state">选择一篇文章查看</p>}
            {detailLoading && <Loading />}
            {!detailLoading && detail && (
              <>
                <div className="admin-detail-header">
                  <h2>{detail.title}</h2>
                  <div className="admin-detail-meta">
                    <span>作者：{detail.authorName}</span>
                    {detail.authorContact && <span>联系：{detail.authorContact}</span>}
                    <span>分类：{detail.category}</span>
                    <span>提交：{formatDateTime(detail.submittedAt)}</span>
                  </div>
                  {detail.tags?.length > 0 && (
                    <div className="article-detail-tags">
                      {detail.tags.map((tag) => (
                        <TagBadge key={tag} name={tag} />
                      ))}
                    </div>
                  )}
                  {detail.reviewNote && (
                    <p className="review-note">驳回原因：{detail.reviewNote}</p>
                  )}
                </div>

                {detail.coverImage && (
                  <img className="article-detail-cover" src={detail.coverImage} alt="" />
                )}

                <p className="admin-summary">{detail.summary}</p>

                <div className="admin-preview markdown-body">
                  <MarkdownRenderer content={detail.content} />
                </div>

                {status === 'pending' && (
                  <div className="admin-actions">
                    {actionMsg && <p className="action-msg">{actionMsg}</p>}
                    {!showReject ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={acting}
                          onClick={handleApprove}
                        >
                          {acting ? '处理中…' : '通过并发布'}
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          disabled={acting}
                          onClick={() => setShowReject(true)}
                        >
                          驳回
                        </button>
                      </>
                    ) : (
                      <div className="reject-form">
                        <label>
                          驳回原因
                          <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="请说明驳回原因（将记录在系统中）"
                            rows={3}
                          />
                        </label>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={acting}
                            onClick={handleReject}
                          >
                            确认驳回
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowReject(false)}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function statusLabel(status) {
  const map = { pending: '待审核', published: '已发布', rejected: '已驳回' }
  return map[status] || status
}
