import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatDateTime } from '../../utils/date'
import { fetchManageArticles, deleteArticle } from '../../api/manage'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
]

export default function ArticlesManagePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || 'all'
  const q = searchParams.get('q') || ''

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState(q)
  const [acting, setActing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchManageArticles({ status, q: q || undefined, pageSize: 50 })
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [status, q])

  useEffect(() => {
    load()
  }, [load])

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  async function handleDelete(id) {
    if (!window.confirm('确定删除这篇文章？')) return
    setActing(id)
    try {
      await deleteArticle(id)
      await load()
    } finally {
      setActing(null)
    }
  }

  return (
    <section>
      <header className="manage-page-header">
        <div>
          <h1>文章管理</h1>
          <p>管理所有文章（草稿 / 已发布）</p>
        </div>
        <Link to="/manage/articles/new" className="btn-primary">
          新建文章
        </Link>
      </header>

      <div className="manage-toolbar">
        <div className="filter-chips">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={status === opt.value ? 'active' : ''}
              onClick={() => setFilter('status', opt.value === 'all' ? null : opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form
          className="manage-search"
          onSubmit={(e) => {
            e.preventDefault()
            setFilter('q', searchInput.trim() || null)
          }}
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索标题或内容…"
          />
          <button type="submit">搜索</button>
        </form>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error.message} />}
      {!loading && data && (
        <div className="manage-table-wrap">
          <table className="manage-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>状态</th>
                <th>阅读量</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    暂无文章
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td>
                      <span className={`status-pill status-${item.status}`}>{item.status}</span>
                    </td>
                    <td>{item.viewCount}</td>
                    <td>{formatDateTime(item.updatedAt || item.publishedAt)}</td>
                    <td className="table-actions">
                      <Link to={`/manage/articles/${item.id}/edit`}>编辑</Link>
                      <button type="button" disabled={acting === item.id} onClick={() => handleDelete(item.id)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
