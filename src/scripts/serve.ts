import { serve } from 'bun'
import { join } from 'path'

const distPath = join(import.meta.dir, '..', '..', 'dist')

serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Serve the file from dist directory
    const filePath = join(distPath, pathname)
    const file = Bun.file(filePath)

    if (await file.exists()) {
      return new Response(file)
    }

    // If file doesn't exist, try to serve index.html from that directory
    const indexPath = join(distPath, pathname, 'index.html')
    const indexFile = Bun.file(indexPath)

    if (await indexFile.exists()) {
      return new Response(indexFile)
    }

    return new Response('404 Not Found', { status: 404 })
  },
})

console.log('Server running at http://localhost:3000')
