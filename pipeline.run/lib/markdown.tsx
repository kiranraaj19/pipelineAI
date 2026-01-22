import { marked } from "marked"

// Configure marked to handle tables
marked.use({
  gfm: true,
  breaks: true,
  mangle: false,
  headerIds: false,
})

export function renderMarkdown(content: string) {
  return {
    __html: marked(content, {
      breaks: true,
      gfm: true,
    }),
  }
}

