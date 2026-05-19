import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

export default function Layout({ showSidebar = true }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className={`content-grid${showSidebar ? ' with-sidebar' : ''}`}>
          <div className="page-content">
            <Outlet />
          </div>
          {showSidebar && <Sidebar />}
        </div>
      </main>
      <Footer />
    </div>
  )
}
