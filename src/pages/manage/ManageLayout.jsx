import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/manage/articles', label: '文章管理', end: false },
  { to: '/manage/articles/new', label: '发布文章', end: true },
  { to: '/manage/tags', label: '标签管理' },
  { to: '/manage/profile', label: '个人资料' },
]

function ManageShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="manage-shell">
      <aside className="manage-sidebar">
        <div className="manage-brand">
          <Link to="/">
            <h2>Faar 后台</h2>
          </Link>
          <p>{user?.nickname || user?.username}</p>
        </div>
        <nav className="manage-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn-secondary manage-logout" onClick={handleLogout}>
          退出登录
        </button>
      </aside>
      <div className="manage-main">
        <Outlet />
      </div>
    </div>
  )
}

export default function ManageLayout() {
  return (
    <ProtectedRoute>
      <ManageShell />
    </ProtectedRoute>
  )
}
