import { useSearchParams } from 'react-router-dom'
import { fetchArticles } from '../api/articles'
import { useAsync } from '../hooks/useAsync'
import ArticleList from '../components/ArticleList'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page'), 10) || 1

  const { data, loading, error } = useAsync(
    () => (q ? fetchArticles({ page, pageSize: 6, q }) : Promise.resolve({ items: [], total: 0, page: 1, totalPages: 0 })),
    [q, page],
  )

  return (
    <section>
      <header className="page-header">
        <h1>搜索</h1>
        {q ? <p>关键词「{q}」共 {data?.total ?? 0} 篇结果</p> : <p>请输入关键词</p>}
      </header>
      <ArticleList data={data} loading={loading && !!q} error={error} basePath="/search" />
    </section>
  )
}
