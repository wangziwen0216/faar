import { useSearchParams } from 'react-router-dom'
import { fetchArticles } from '../api/articles'
import { useAsync } from '../hooks/useAsync'
import ArticleList from '../components/ArticleList'

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page'), 10) || 1

  const { data, loading, error } = useAsync(
    () => fetchArticles({ page, pageSize: 6 }),
    [page],
  )

  return (
    <section>
      <header className="page-header">
        <h1>最新文章</h1>
        <p>分享技术笔记与生活随笔</p>
      </header>
      <ArticleList data={data} loading={loading} error={error} basePath="/" />
    </section>
  )
}
