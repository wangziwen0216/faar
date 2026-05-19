import { Link, NavLink } from 'react-router-dom'
import SearchBar from './SearchBar'

export default function Header() {
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
          <NavLink to="/submit">投稿</NavLink>
          <NavLink to="/admin">审核</NavLink>
        </nav>
        <SearchBar />
      </div>
    </header>
  )
}
