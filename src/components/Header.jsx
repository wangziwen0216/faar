import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SearchBar from './SearchBar'

export default function Header() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="site-logo">
          Faar
        </Link>
        <nav className="site-nav" aria-label="主导航">
          <NavLink to="/" end>
            首页
          </NavLink>
          <NavLink to="/archive">归档</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/manage/articles">后台</NavLink>
              <button type="button" className="nav-btn" onClick={() => logout()}>
                退出
              </button>
            </>
          ) : (
            <NavLink to="/login">登录</NavLink>
          )}
        </nav>
        <SearchBar />
      </div>
    </header>
  )
}
