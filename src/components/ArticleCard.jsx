import { Link } from 'react-router-dom'
import { formatDate } from '../utils/date'
import TagBadge from './TagBadge'

export default function ArticleCard({ article }) {
  return (
    <article className="article-card">
      <Link to={`/posts/${article.slug}`} className="article-card-cover">
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
          <span className="meta-dot">·</span>
          <Link to={`/category/${encodeURIComponent(article.category)}`} className="category-link">
            {article.category}
          </Link>
        </div>
        <h2>
          <Link to={`/posts/${article.slug}`}>{article.title}</Link>
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
