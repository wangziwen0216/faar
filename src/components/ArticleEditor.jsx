import { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

const EMPTY = {
  title: '',
  summary: '',
  coverImage: '',
  category: '',
  tags: '',
  authorName: '',
  authorContact: '',
  content: '',
}

export default function ArticleEditor({
  initialValues = EMPTY,
  categoryOptions = [],
  onSubmit,
  submitLabel = '提交投稿',
  showAuthorFields = true,
}) {
  const [form, setForm] = useState({ ...EMPTY, ...initialValues })
  const [tab, setTab] = useState('edit')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.response?.data?.message || err.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="article-editor" onSubmit={handleSubmit}>
      <div className="editor-grid">
        <label>
          标题 <span className="required">*</span>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="文章标题"
            required
            maxLength={120}
          />
        </label>

        <label>
          分类 <span className="required">*</span>
          <input
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder="如：前端、随笔"
            list="category-options"
            required
          />
          <datalist id="category-options">
            {categoryOptions.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </label>

        <label className="editor-full">
          简介 <span className="required">*</span>
          <textarea
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="一句话概括文章内容（将显示在列表页）"
            rows={3}
            required
            maxLength={300}
          />
        </label>

        <label className="editor-full">
          封面图 URL
          <input
            value={form.coverImage}
            onChange={(e) => update('coverImage', e.target.value)}
            placeholder="https://example.com/cover.jpg（可选）"
            type="url"
          />
        </label>

        <label className="editor-full">
          标签
          <input
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            placeholder="多个标签用逗号分隔，如：React, Vite"
          />
        </label>

        {showAuthorFields && (
          <>
            <label>
              作者昵称 <span className="required">*</span>
              <input
                value={form.authorName}
                onChange={(e) => update('authorName', e.target.value)}
                placeholder="你的昵称"
                required
                maxLength={40}
              />
            </label>
            <label>
              联系方式
              <input
                value={form.authorContact}
                onChange={(e) => update('authorContact', e.target.value)}
                placeholder="邮箱或微信（可选，仅管理员可见）"
                maxLength={80}
              />
            </label>
          </>
        )}
      </div>

      <div className="editor-content-section">
        <div className="editor-tabs">
          <button
            type="button"
            className={tab === 'edit' ? 'active' : ''}
            onClick={() => setTab('edit')}
          >
            编辑
          </button>
          <button
            type="button"
            className={tab === 'preview' ? 'active' : ''}
            onClick={() => setTab('preview')}
          >
            预览
          </button>
        </div>

        {tab === 'edit' ? (
          <label className="editor-full">
            正文（Markdown） <span className="required">*</span>
            <textarea
              className="editor-markdown"
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder="使用 Markdown 编写正文…"
              required
            />
          </label>
        ) : (
          <div className="editor-preview markdown-body">
            {form.content ? (
              <MarkdownRenderer content={form.content} />
            ) : (
              <p className="empty-state">暂无内容</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '提交中…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
