import { Link } from 'react-router-dom'

export default function TagBadge({ name, active = false }) {
  return (
    <Link to={`/tag/${encodeURIComponent(name)}`} className={`tag-badge${active ? ' active' : ''}`}>
      {name}
    </Link>
  )
}
