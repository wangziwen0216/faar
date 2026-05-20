import { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

const EMPTY = {
  title: '',
  summary: '',
  coverImage: '',
  category: '',
  tags: '',
  status: 'draft',
  authorName: '',
  authorContact: '',
  content: '',
}

export default function ArticleEditor({
  initialValues = EMPTY,
  categoryOptions = [],
  tagOptions = [],
  onSubmit,
  submitLabel = '提交投稿',
  showAuthorFields = true,
  showStatusField = false,
  livePreview = false,
  hideCategory = false,
}) {
  const [form, setForm] = useState({ ...EMPTY, ...initialValues })
  const [tab, setTab] = useState(livePreview ? 'split' : 'edit')
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

  const previewContent = form.content ? (
    <MarkdownRenderer content={form.content} />
  ) : (
    <p className="empty-state">暂无内容</p>
  )

  const tagHint = tagOptions.length > 0 ? tagOptions.map((t) => t.name).join('、') : ''

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
            maxLength={200}
          />
        </label>

        {!hideCategory && (
          <label>
            分类 <span className="required">*</span>
            <input
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              placeholder="如：前端、随笔"
              list="category-options"
              required={!hideCategory}
            />
            <datalist id="category-options">
              {categoryOptions.map((c) => (
                <option key={c.id || c.name} value={c.name} />
              ))}
            </datalist>
          </label>
        )}

        {showStatusField && (
          <label>
            状态
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="draft">草稿</option>
              <option value="published">立即发布</option>
            </select>
          </label>
        )}

        <label className="editor-full">
          简介 <span className="required">*</span>
          <textarea
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="一句话概括文章内容"
            rows={3}
            required
            maxLength={500}
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
            placeholder={tagHint ? `可选：${tagHint}` : '多个标签用逗号分隔'}
          />
          {tagOptions.length > 0 && (
            <span className="form-hint">请使用已在后台创建的标签名称，逗号分隔</span>
          )}
        </label>

        {showAuthorFields && (
          <>
            <label>
              作者昵称 <span className="required">*</span>
              <input
                value={form.authorName}
                onChange={(e) => update('authorName', e.target.value)}
                required
                maxLength={40}
              />
            </label>
            <label>
              联系方式
              <input
                value={form.authorContact}
                onChange={(e) => update('authorContact', e.target.value)}
                maxLength={80}
              />
            </label>
          </>
        )}
      </div>

      <div className="editor-content-section">
        <div className="editor-tabs">
          {livePreview && (
            <button type="button" className={tab === 'split' ? 'active' : ''} onClick={() => setTab('split')}>
              实时预览
            </button>
          )}
          <button type="button" className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>
            编辑
          </button>
          {!livePreview && (
            <button type="button" className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
              预览
            </button>
          )}
        </div>

        {tab === 'split' && livePreview && (
          <div className="editor-split">
            <label className="editor-full">
              正文（Markdown） <span className="required">*</span>
              <textarea
                className="editor-markdown"
                value={form.content}
                onChange={(e) => update('content', e.target.value)}
                required
              />
            </label>
            <div className="editor-preview markdown-body">{previewContent}</div>
          </div>
        )}

        {tab === 'edit' && (
          <label className="editor-full">
            正文（Markdown） <span className="required">*</span>
            <textarea
              className="editor-markdown"
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              required
            />
          </label>
        )}

        {tab === 'preview' && !livePreview && (
          <div className="editor-preview markdown-body">{previewContent}</div>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '保存中…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
