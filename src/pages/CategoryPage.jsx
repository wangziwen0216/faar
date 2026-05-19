import { useParams, useSearchParams } from 'react-router-dom'
import { fetchArticles } from '../api/articles'
import { useAsync } from '../hooks/useAsync'
import ArticleList from '../components/ArticleList'

export default function CategoryPage() {
  const { name } = useParams()
  const category = decodeURIComponent(name)
  const [searchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page'), 10) || 1

  const { data, loading, error } = useAsync(
    () => fetchArticles({ page, pageSize: 6, category }),
    [category, page],
  )

  return (
    <section>
      <header className="page-header">
        <h1>分类：{category}</h1>
      </header>
      <ArticleList
        data={data}
        loading={loading}
        error={error}
        basePath={`/category/${encodeURIComponent(category)}`}
      />
    </section>
  )
}
