import { useEffect, useState } from 'react'
import { fetchManageTags, createTag, updateTag, deleteTag } from '../../api/manage'
import Loading from '../../components/Loading'

export default function TagsManagePage() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')

  async function load() {
    setLoading(true)
    const data = await fetchManageTags()
    setTags(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    await createTag({ name: name.trim() })
    setName('')
    load()
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    await updateTag(id, { name: editName.trim() })
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('确定删除该标签？')) return
    try {
      await deleteTag(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || '删除失败')
    }
  }

  if (loading) return <Loading />

  return (
    <section>
      <header className="manage-page-header">
        <h1>标签管理</h1>
        <p>增删改查博客标签</p>
      </header>

      <form className="inline-form" onSubmit={handleCreate}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="新标签名称" />
        <button type="submit" className="btn-primary">
          添加
        </button>
      </form>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>文章数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td>
                  {editing === tag.id ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    tag.name
                  )}
                </td>
                <td>{tag.articleCount}</td>
                <td className="table-actions">
                  {editing === tag.id ? (
                    <>
                      <button type="button" onClick={() => handleUpdate(tag.id)}>
                        保存
                      </button>
                      <button type="button" onClick={() => setEditing(null)}>
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(tag.id)
                          setEditName(tag.name)
                        }}
                      >
                        编辑
                      </button>
                      <button type="button" onClick={() => handleDelete(tag.id)}>
                        删除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
