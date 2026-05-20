import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { fetchArticle } from '../api/articles'
import { useAsync } from '../hooks/useAsync'
import { formatDateTime } from '../utils/date'
import { extractHeadings } from '../utils/toc'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import MarkdownRenderer from '../components/MarkdownRenderer'
import TableOfContents from '../components/TableOfContents'
import TagBadge from '../components/TagBadge'
import GiscusComments from '../components/GiscusComments'

export default function ArticleDetailPage() {
  const { id } = useParams()
  const { data: article, loading, error } = useAsync(() => fetchArticle(id), [id])

  const headings = useMemo(
    () => (article?.content ? extractHeadings(article.content) : []),
    [article?.content],
  )

  if (loading) return <Loading />
  if (error) return <ErrorMessage message="文章加载失败" />
  if (!article) return <ErrorMessage message="文章不存在" />

  return (
    <article className="article-detail">
      <header className="article-detail-header">
        <h1>{article.title}</h1>
        <div className="article-detail-meta">
          <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt)}</time>
          <span className="meta-dot">·</span>
          <span>{article.viewCount} 阅读</span>
        </div>
        {article.tags?.length > 0 && (
          <div className="article-detail-tags">
            {article.tags.map((tag) => (
              <TagBadge key={tag} name={tag} />
            ))}
          </div>
        )}
      </header>

      {article.coverImage && (
        <img className="article-detail-cover" src={article.coverImage} alt="" />
      )}

      <div className="article-detail-layout">
        <MarkdownRenderer content={article.content} />
        <aside className="article-detail-aside">
          <TableOfContents headings={headings} />
        </aside>
      </div>

      <GiscusComments slug={String(article.id)} title={article.title} />
    </article>
  )
}
