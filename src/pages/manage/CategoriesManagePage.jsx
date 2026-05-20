import { useEffect, useState } from 'react'
import { fetchManageCategories, createCategory, updateCategory, deleteCategory } from '../../api/manage'
import Loading from '../../components/Loading'

export default function CategoriesManagePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  async function load() {
    setLoading(true)
    const data = await fetchManageCategories()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    await createCategory({ name: name.trim(), description: description.trim() || undefined })
    setName('')
    setDescription('')
    load()
  }

  async function handleUpdate(id) {
    await updateCategory(id, editForm)
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('确定删除该分类？')) return
    try {
      await deleteCategory(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || '删除失败')
    }
  }

  if (loading) return <Loading />

  return (
    <section>
      <header className="manage-page-header">
        <h1>分类管理</h1>
        <p>增删改查文章分类</p>
      </header>

      <form className="inline-form stacked" onSubmit={handleCreate}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="分类名称" required />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述（可选）"
        />
        <button type="submit" className="btn-primary">
          添加分类
        </button>
      </form>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>描述</th>
              <th>文章数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((cat) => (
              <tr key={cat.id}>
                <td>
                  {editing === cat.id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td>
                  {editing === cat.id ? (
                    <input
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  ) : (
                    cat.description || '—'
                  )}
                </td>
                <td>{cat.articleCount}</td>
                <td className="table-actions">
                  {editing === cat.id ? (
                    <>
                      <button type="button" onClick={() => handleUpdate(cat.id)}>
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
                          setEditing(cat.id)
                          setEditForm({ name: cat.name, description: cat.description || '' })
                        }}
                      >
                        编辑
                      </button>
                      <button type="button" onClick={() => handleDelete(cat.id)}>
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
