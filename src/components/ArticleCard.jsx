import { Link } from 'react-router-dom'
import { formatDate } from '../utils/date'
import TagBadge from './TagBadge'

export default function ArticleCard({ article }) {
  return (
    <article className="article-card">
      <Link to={`/posts/${article.id}`} className="article-card-cover">
        {article.coverImage ? (
          <img src={article.coverImage} alt="" loading="lazy" />
        ) : (
          <div className="article-card-placeholder" />
        )}
      </Link>
      <div className="article-card-body">
        <div className="article-card-meta">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          <span className="meta-dot">·</span>
          <span>{article.viewCount} 阅读</span>
        </div>
        <h2>
          <Link to={`/posts/${article.id}`}>{article.title}</Link>
        </h2>
        <p className="article-card-summary">{article.summary}</p>
        {article.tags?.length > 0 && (
          <div className="article-card-tags">
            {article.tags.map((tag) => (
              <TagBadge key={tag} name={tag} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
