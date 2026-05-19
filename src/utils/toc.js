import GithubSlugger from 'github-slugger'

const HEADING_RE = /^(#{1,3})\s+(.+)$/

export function extractHeadings(markdown) {
  const slugger = new GithubSlugger()
  const lines = markdown.split('\n')
  const headings = []

  for (const line of lines) {
    const match = line.match(HEADING_RE)
    if (!match) continue

    const level = match[1].length
    const text = match[2].replace(/[#*`[\]]/g, '').trim()
    const id = slugger.slug(text)
    headings.push({ level, text, id })
  }

  return headings
}
