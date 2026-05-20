import { useParams, useSearchParams } from 'react-router-dom'
import { fetchArticles, fetchTagByName } from '../api/articles'
import { useAsync } from '../hooks/useAsync'
import ArticleList from '../components/ArticleList'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function TagPage() {
  const { name } = useParams()
  const tagName = decodeURIComponent(name)
  const [searchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page'), 10) || 1

  const tag = useAsync(() => fetchTagByName(tagName), [tagName])
  const articles = useAsync(
    () => (tag.data ? fetchArticles({ page, pageSize: 6, tagId: tag.data.id }) : Promise.resolve({ items: [], total: 0, page: 1, totalPages: 0 })),
    [tag.data?.id, page],
  )

  if (tag.loading) return <Loading />
  if (!tag.data) return <ErrorMessage message="标签不存在" />

  return (
    <section>
      <header className="page-header">
        <h1>标签：{tagName}</h1>
      </header>
      <ArticleList data={articles.data} loading={articles.loading} error={articles.error} basePath={`/tag/${encodeURIComponent(tagName)}`} />
    </section>
  )
}
