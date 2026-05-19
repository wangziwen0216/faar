import { Link } from 'react-router-dom'
import { fetchArchives } from '../api/articles'
import { useAsync } from '../hooks/useAsync'
import { archiveLabel } from '../utils/date'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function ArchivePage() {
  const { data, loading, error } = useAsync(() => fetchArchives(), [])

  if (loading) return <Loading />
  if (error) return <ErrorMessage />

  return (
    <section>
      <header className="page-header">
        <h1>文章归档</h1>
        <p>按年月浏览全部文章</p>
      </header>
      <ul className="archive-timeline">
        {data?.map((a) => (
          <li key={`${a.year}-${a.month}`}>
            <Link to={`/archive/${a.year}/${a.month}`}>
              <span className="archive-label">{archiveLabel(a.year, a.month)}</span>
              <span className="archive-count">{a.count} 篇</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
