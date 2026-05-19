import { Link, useSearchParams } from 'react-router-dom'

export default function Pagination({ page, totalPages, basePath = '/' }) {
  if (totalPages <= 1) return null

  const [searchParams] = useSearchParams()

  function pageUrl(p) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <nav className="pagination" aria-label="分页">
      {page > 1 && (
        <Link to={pageUrl(page - 1)} className="page-btn">
          上一页
        </Link>
      )}
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="page-ellipsis">
            …
          </span>
        ) : (
          <Link
            key={p}
            to={pageUrl(p)}
            className={`page-num${p === page ? ' active' : ''}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link to={pageUrl(page + 1)} className="page-btn">
          下一页
        </Link>
      )}
    </nav>
  )
}
