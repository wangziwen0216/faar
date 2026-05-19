import { useEffect, useState } from 'react'

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!headings.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 1] },
    )

    for (const { id } of headings) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  return (
    <nav className="toc" aria-label="目录">
      <h4>目录</h4>
      <ul>
        {headings.map((h) => (
          <li key={h.id} className={`toc-level-${h.level}`}>
            <a
              href={`#${h.id}`}
              className={activeId === h.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
