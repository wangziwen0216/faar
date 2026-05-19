import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import TagPage from './pages/TagPage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import ArchivePage from './pages/ArchivePage'
import ArchiveMonthPage from './pages/ArchiveMonthPage'
import SubmitArticlePage from './pages/SubmitArticlePage'
import AdminReviewPage from './pages/AdminReviewPage'

const router = createBrowserRouter([
  {
    element: <Layout showSidebar />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/submit', element: <SubmitArticlePage /> },
      { path: '/admin', element: <AdminReviewPage /> },
      { path: '/tag/:name', element: <TagPage /> },
      { path: '/category/:name', element: <CategoryPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/archive', element: <ArchivePage /> },
      { path: '/archive/:year/:month', element: <ArchiveMonthPage /> },
    ],
  },
  {
    element: <Layout showSidebar={false} />,
    children: [{ path: '/posts/:slug', element: <ArticleDetailPage /> }],
  },
])

export default router
