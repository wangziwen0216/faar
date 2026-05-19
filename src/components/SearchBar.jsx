import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SearchBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        type="search"
        placeholder="搜索标题或内容…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="搜索"
      />
      <button type="submit">搜索</button>
    </form>
  )
}
