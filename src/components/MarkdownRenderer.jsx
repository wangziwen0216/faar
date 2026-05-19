import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
