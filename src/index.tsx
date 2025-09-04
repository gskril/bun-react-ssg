import { write } from 'bun'
import { minify } from 'html-minifier-terser'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'path'
import { renderToString } from 'react-dom/server'

import { createHtml } from './lib/html'

interface RouteInfo {
  path: string
  outputFile: string
  isDynamic: boolean
  params?: Record<string, string>
  props?: any
}

interface GenerateStaticParamsResult {
  params: Record<string, string>
  props?: any
}

async function generateStaticFiles() {
  const startTime = Date.now()

  // Create dist directory if it doesn't exist
  await mkdir('dist', { recursive: true })

  // Get all routes (including dynamic ones)
  const routes = await getAllRoutes('src/react/pages')

  // Generate HTML for each route
  for (const route of routes) {
    await generateRoute(route)
  }

  const endTime = Date.now()
  const duration = endTime - startTime
  console.log(`Generated ${routes.length} static files in ${duration}ms`)
}

async function getAllRoutes(
  pagesDir: string,
  basePath = ''
): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = []
  const items = await readdir(pagesDir)

  for (const item of items) {
    const fullPath = join(pagesDir, item)
    const itemStat = await stat(fullPath)

    if (itemStat.isDirectory()) {
      // Recursively handle nested directories
      const nestedRoutes = await getAllRoutes(fullPath, join(basePath, item))
      routes.push(...nestedRoutes)
    } else if (item.endsWith('.tsx')) {
      const fileName = item.replace('.tsx', '')
      const routePath = join(basePath, fileName)

      // Check if this is a dynamic route
      const isDynamic = fileName.startsWith('[') && fileName.endsWith(']')

      if (isDynamic) {
        // Handle dynamic routes
        const dynamicRoutes = await handleDynamicRoute(routePath, fullPath)
        routes.push(...dynamicRoutes)
      } else {
        // Handle static routes
        const isIndex = fileName === 'index'
        const outputPath = basePath
          ? isIndex
            ? `${basePath}/index.html`
            : `${basePath}/${fileName}/index.html`
          : isIndex
          ? 'index.html'
          : `${fileName}/index.html`

        routes.push({
          path: routePath,
          outputFile: outputPath,
          isDynamic: false,
        })
      }
    }
  }

  return routes
}

async function handleDynamicRoute(
  routePath: string,
  filePath: string
): Promise<RouteInfo[]> {
  try {
    // Import the dynamic route module
    const module = await import(`../${filePath}`)

    if (!module.generateStaticParams) {
      console.warn(
        `Dynamic route ${routePath} missing generateStaticParams function`
      )
      return []
    }

    // Get the static params
    const staticParams: GenerateStaticParamsResult[] =
      await module.generateStaticParams()

    return staticParams.map((paramResult) => {
      // Extract the dynamic segment name (e.g., '[id]' -> 'id')
      const paramName =
        routePath.split('/').pop()?.replace('[', '').replace(']', '') || ''
      const paramValue = paramResult.params[paramName]

      // Create output path by replacing [param] with actual value
      const outputPath =
        routePath.replace(`[${paramName}]`, paramValue) + '/index.html'

      return {
        path: routePath,
        outputFile: outputPath,
        isDynamic: true,
        params: paramResult.params,
        props: paramResult.props,
      }
    })
  } catch (error) {
    console.error(`Error handling dynamic route ${routePath}:`, error)
    return []
  }
}

async function generateRoute(route: RouteInfo) {
  // Create nested directories if needed
  const filePath = join('dist', route.outputFile)
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

  // Prepare props for the page component
  let pageProps: any = {}
  if (route.isDynamic) {
    pageProps.params = route.params
    if (route.props) {
      Object.assign(pageProps, route.props)
    }
  }

  // Render React component to string (support async components)
  const pageElement =
    Page.constructor.name === 'AsyncFunction' ? (
      await Page(pageProps)
    ) : (
      <Page {...pageProps} />
    )
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

// Run the static site generator
generateStaticFiles().catch(console.error)
