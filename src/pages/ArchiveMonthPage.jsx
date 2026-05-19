import { useParams, useSearchParams } from 'react-router-dom'
import { fetchArticles } from '../api/articles'
import { useAsync } from '../hooks/useAsync'
import { archiveLabel } from '../utils/date'
import ArticleList from '../components/ArticleList'

export default function ArchiveMonthPage() {
  const { year, month } = useParams()
  const [searchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page'), 10) || 1

  const { data, loading, error } = useAsync(
    () => fetchArticles({ page, pageSize: 6, year, month }),
    [year, month, page],
  )

  return (
    <section>
      <header className="page-header">
        <h1>{archiveLabel(year, month)}</h1>
      </header>
      <ArticleList
        data={data}
        loading={loading}
        error={error}
        basePath={`/archive/${year}/${month}`}
      />
    </section>
  )
}
