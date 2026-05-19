import ArticleCard from './ArticleCard'
import Pagination from './Pagination'
import Loading from './Loading'
import ErrorMessage from './ErrorMessage'

export default function ArticleList({ data, loading, error, basePath = '/' }) {
  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error.message || undefined} />
  if (!data?.items?.length) {
    return <p className="empty-state">暂无文章</p>
  }

  return (
    <>
      <div className="article-list">
        {data.items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} basePath={basePath} />
    </>
  )
}
