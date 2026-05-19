import { useEffect, useRef } from 'react'

export default function GiscusComments({ slug, title }) {
  const containerRef = useRef(null)

  const repo = import.meta.env.VITE_GISCUS_REPO
  const repoId = import.meta.env.VITE_GISCUS_REPO_ID
  const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID

  useEffect(() => {
    if (!repo || !repoId || !categoryId || !containerRef.current) return undefined

    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', repo)
    script.setAttribute('data-repo-id', repoId)
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', categoryId)
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-term', `${slug} - ${title}`)
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', 'zh-CN')
    script.crossOrigin = 'anonymous'
    script.async = true

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [slug, title, repo, repoId, categoryId])

  if (!repo || !repoId || !categoryId) {
    return (
      <section className="comments comments-placeholder">
        <h3>评论</h3>
        <p>
          在 <code>.env</code> 中配置 <code>VITE_GISCUS_*</code> 变量以启用 Giscus 评论。
        </p>
      </section>
    )
  }

  return (
    <section className="comments">
      <h3>评论</h3>
      <div ref={containerRef} />
    </section>
  )
}
