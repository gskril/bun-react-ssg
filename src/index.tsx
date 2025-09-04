import { write } from 'bun'
import { minify } from 'html-minifier-terser'
import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'path'
import { renderToString } from 'react-dom/server'

import { createHtml } from './lib/html'

async function generateStaticFiles() {
  // Create out directory if it doesn't exist
  await mkdir('out', { recursive: true })

  // Get the page routes based on the files in the src/react/pages directory
  const routes = await readdir('src/react/pages').then((files) =>
    files.map((file) => {
      const path = file.replace('.tsx', '')
      const isIndex = path === 'index'

      return {
        path,
        outputFile: isIndex ? 'index.html' : `${path}/index.html`,
      }
    })
  )

  // Generate HTML for each route
  for (const route of routes) {
    // Create nested directories if needed
    const filePath = join('out', route.outputFile)
    const dirPath = filePath.split('/').slice(0, -1).join('/')
    if (dirPath) {
      await mkdir(dirPath, { recursive: true })
    }

    // Get the default export from the file
    const { default: Page, metadata } = await import(
      `./react/pages/${route.path}`
    )

    if (!metadata) {
      throw new Error(`Missing metadata in /src/react/pages/${route.path}.tsx`)
    }

    // Render React component to string (support async components)
    const pageElement =
      Page.constructor.name === 'AsyncFunction' ? await Page() : <Page />
    const html = renderToString(pageElement)

    // Wrap with HTML document
    const document = await minify(createHtml({ html, metadata }), {
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
    })

    // Write to file
    await write(filePath, document)
    console.log(`Generated ${filePath}`)
  }

  console.log('Static site generation complete!')
}

// Run the static site generator
generateStaticFiles().catch(console.error)
