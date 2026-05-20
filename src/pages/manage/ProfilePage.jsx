import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchProfile, updateProfile } from '../../api/manage'

export default function ProfilePage() {
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({ nickname: '', email: '', avatar: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setForm({
          nickname: data.nickname || '',
          email: data.email || '',
          avatar: data.avatar || '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      await updateProfile(form)
      await refreshUser()
      setMsg('资料已更新')
    } catch (err) {
      setError(err.message || '保存失败')
    }
  }

  if (loading) return <p className="loading">加载中…</p>

  return (
    <section>
      <header className="manage-page-header">
        <h1>个人资料</h1>
        <p>修改昵称、头像、邮箱</p>
      </header>

      <form className="profile-form admin-login-form" onSubmit={handleSubmit}>
        <label>
          昵称
          <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
        </label>
        <label>
          邮箱
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          头像 URL
          <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} />
        </label>
        {form.avatar && <img className="profile-avatar-preview" src={form.avatar} alt="" />}

        {msg && <p className="action-msg">{msg}</p>}
        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary">
          保存资料
        </button>
      </form>
    </section>
  )
}
