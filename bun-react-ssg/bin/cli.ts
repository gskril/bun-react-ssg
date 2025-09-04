#!/usr/bin/env bun
import { serve } from 'bun'
import { join, resolve } from 'path'

import { buildSite } from '../src/index'

function printHelp() {
  console.log(`bun-react-ssg <command> [options]

Commands:
  build	Build static site
  serve	Serve the dist directory

Options:
  --pages <dir>	Path to pages directory (default: src/pages)
  --dist <dir>	Path to output directory (default: dist)
  --port <port>	Port for serve (default: 3000)
  -h, --help	Show help
`)
}

const args = process.argv.slice(2)
const command = args[0]

function readFlag(name: string, fallback?: string) {
  const idx = args.findIndex((a) => a === name)
  if (idx !== -1 && args[idx + 1]) return args[idx + 1]
  return fallback
}

async function main() {
  if (!command || command === '-h' || command === '--help') {
    printHelp()
    process.exit(0)
  }

  const pagesDir = readFlag('--pages', 'src/pages')!
  const distDir = readFlag('--dist', 'dist')!

  if (command === 'build') {
    await buildSite({ pagesDir, distDir })
    return
  }

  if (command === 'serve') {
    const portStr = readFlag('--port', '3000')!
    const port = Number(portStr)
    const distPath = resolve(distDir)
    serve({
      port,
      async fetch(request) {
        const url = new URL(request.url)
        const pathname = url.pathname

        const filePath = join(distPath, pathname)
        const file = Bun.file(filePath)
        if (await file.exists()) {
          return new Response(file)
        }

        const indexPath = join(distPath, pathname, 'index.html')
        const indexFile = Bun.file(indexPath)
        if (await indexFile.exists()) {
          return new Response(indexFile)
        }

        return new Response('404 Not Found', { status: 404 })
      },
    })
    console.log(`Server running at http://localhost:${port}`)
    return
  }

  console.error(`Unknown command: ${command}`)
  printHelp()
  process.exit(1)
}

await main()
