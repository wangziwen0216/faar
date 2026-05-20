import { useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { fetchManageArticle, createArticle, updateArticle, fetchManageTags } from '../../api/manage'
import ArticleEditor from '../../components/ArticleEditor'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'

export default function ArticleEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const tags = useAsync(() => fetchManageTags(), [])
  const article = useAsync(() => (isNew ? Promise.resolve(null) : fetchManageArticle(id)), [id, isNew])

  if (!isNew && article.loading) return <Loading />
  if (!isNew && article.error) return <ErrorMessage message="加载失败" />

  const initialValues = article.data
    ? {
        title: article.data.title,
        summary: article.data.summary,
        coverImage: article.data.coverImage || '',
        tags: article.data.tags?.join(', ') || '',
        status: article.data.status,
        content: article.data.content,
      }
    : undefined

  async function handleSubmit(form) {
    const allTags = tags.data || []
    if (isNew) {
      const created = await createArticle(form, allTags)
      navigate(`/manage/articles/${created.id}/edit`, { replace: true })
    } else {
      await updateArticle(id, form, allTags)
      navigate('/manage/articles')
    }
  }

  return (
    <section>
      <header className="manage-page-header">
        <div>
          <h1>{isNew ? '发布文章' : '编辑文章'}</h1>
          <p>支持 Markdown 实时预览，保存后自动更新 updated_at</p>
        </div>
      </header>
      <ArticleEditor
        key={article.data?.id || 'new'}
        initialValues={initialValues}
        tagOptions={tags.data || []}
        onSubmit={handleSubmit}
        submitLabel={isNew ? '创建文章' : '保存修改'}
        showAuthorFields={false}
        showStatusField
        livePreview
        hideCategory
      />
    </section>
  )
}
