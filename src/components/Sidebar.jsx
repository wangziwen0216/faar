import { Link } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { fetchTags, fetchArchives } from '../api/articles'
import { archiveLabel } from '../utils/date'
import Loading from './Loading'

export default function Sidebar() {
  const tags = useAsync(() => fetchTags(), [])
  const archives = useAsync(() => fetchArchives(), [])

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h3>标签</h3>
        {tags.loading ? (
          <Loading />
        ) : (
          <div className="tag-cloud">
            {tags.data?.map((t) => (
              <Link key={t.id || t.name} to={`/tag/${encodeURIComponent(t.name)}`} className="tag-badge">
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="sidebar-section">
        <h3>归档</h3>
        {archives.loading ? (
          <Loading />
        ) : (
          <ul className="sidebar-list">
            {archives.data?.map((a) => (
              <li key={`${a.year}-${a.month}`}>
                <Link to={`/archive/${a.year}/${a.month}`}>
                  {archiveLabel(a.year, a.month)}
                  <span className="count">{a.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/archive" className="sidebar-more">
          查看全部归档 →
        </Link>
      </section>
    </aside>
  )
}
