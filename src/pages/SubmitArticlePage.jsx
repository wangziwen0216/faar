import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCategories } from '../api/articles'
import { submitArticle } from '../api/submissions'
import { useAsync } from '../hooks/useAsync'
import ArticleEditor from '../components/ArticleEditor'

export default function SubmitArticlePage() {
  const { data: categories } = useAsync(() => fetchCategories(), [])
  const [success, setSuccess] = useState(null)

  async function handleSubmit(form) {
    const result = await submitArticle({
      title: form.title,
      summary: form.summary,
      coverImage: form.coverImage || undefined,
      category: form.category,
      tags: form.tags,
      authorName: form.authorName,
      authorContact: form.authorContact || undefined,
      content: form.content,
    })
    setSuccess(result)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (success) {
    return (
      <section className="submit-success">
        <header className="page-header">
          <h1>投稿成功</h1>
          <p>{success.message}</p>
        </header>
        <div className="success-card">
          <p>
            文章 ID：<strong>{success.id}</strong>
          </p>
          <p>审核通过后将在首页展示，请耐心等待。</p>
          <div className="form-actions">
            <Link to="/submit" className="btn-secondary" onClick={() => setSuccess(null)}>
              继续投稿
            </Link>
            <Link to="/" className="btn-primary">
              返回首页
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <header className="page-header">
        <h1>投稿文章</h1>
        <p>填写以下内容并提交，管理员审核通过后即可公开发布。</p>
      </header>
      <ArticleEditor categoryOptions={categories || []} onSubmit={handleSubmit} />
    </section>
  )
}
