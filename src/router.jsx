import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import TagPage from './pages/TagPage'
import SearchPage from './pages/SearchPage'
import ArchivePage from './pages/ArchivePage'
import ArchiveMonthPage from './pages/ArchiveMonthPage'
import LoginPage from './pages/LoginPage'
import ManageLayout from './pages/manage/ManageLayout'
import ArticlesManagePage from './pages/manage/ArticlesManagePage'
import ArticleEditPage from './pages/manage/ArticleEditPage'
import TagsManagePage from './pages/manage/TagsManagePage'
import ProfilePage from './pages/manage/ProfilePage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/manage',
    element: <ManageLayout />,
    children: [
      { index: true, element: <Navigate to="/manage/articles" replace /> },
      { path: 'articles', element: <ArticlesManagePage /> },
      { path: 'articles/new', element: <ArticleEditPage /> },
      { path: 'articles/:id/edit', element: <ArticleEditPage /> },
      { path: 'tags', element: <TagsManagePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '/admin', element: <Navigate to="/manage/articles" replace /> },
  {
    element: <Layout showSidebar />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tag/:name', element: <TagPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/archive', element: <ArchivePage /> },
      { path: '/archive/:year/:month', element: <ArchiveMonthPage /> },
    ],
  },
  {
    element: <Layout showSidebar={false} />,
    children: [{ path: '/posts/:id', element: <ArticleDetailPage /> }],
  },
  { path: '/submit', element: <Navigate to="/" replace /> },
  { path: '/category/:name', element: <Navigate to="/" replace /> },
])

export default router
