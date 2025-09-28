import { write } from 'bun'
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { renderToString } from 'react-dom/server'

import { createHtml } from './html'
import type { GenerateStaticParamsResult } from './types'

export type BuildSiteOptions = {
  pagesDir: string // e.g., 'src/pages'
  distDir?: string // e.g., 'dist'
  url?: string // Base site URL for sitemap generation (e.g., https://example.com)
}

type RouteInfo = {
  path: string
  outputFile: string
  isDynamic: boolean
  params?: Record<string, string>
  props?: any
  metadata?: import('./html').Metadata
}

export async function buildSite({
  pagesDir,
  distDir = 'dist',
  url,
}: BuildSiteOptions) {
  const startTime = Date.now()

  const absolutePagesDir = resolve(pagesDir)
  const absoluteDistDir = resolve(distDir)
  const absolutePublicDir = resolve('public')

  await mkdir(absoluteDistDir, { recursive: true })

  // Copy public files first
  await copyPublicFiles(absolutePublicDir, absoluteDistDir)

  const routes = await getAllRoutes(absolutePagesDir, '')

  for (const route of routes) {
    await generateRoute(route, absolutePagesDir, absoluteDistDir)
  }

  // Generate sitemap.xml if a base URL is provided
  if (url && typeof url === 'string' && url.trim().length > 0) {
    try {
      await generateSitemap(absoluteDistDir, routes, url)
      console.log(`Generated sitemap.xml with ${routes.length} entries`)
    } catch (error) {
      console.warn('Warning: Failed to generate sitemap.xml:', error)
    }
  } else {
    console.warn('Skipping sitemap.xml generation: --url not provided')
  }

  const duration = Date.now() - startTime
  console.log(`Generated ${routes.length} static files in ${duration}ms`)
}

async function copyPublicFiles(publicDirAbs: string, distDirAbs: string) {
  try {
    const publicStat = await stat(publicDirAbs)
    if (!publicStat.isDirectory()) {
      return // No public directory, skip
    }

    await copyDirectory(publicDirAbs, distDirAbs)
  } catch (error) {
    // Public directory doesn't exist, skip silently
    if ((error as any).code !== 'ENOENT') {
      console.warn(`Warning: Could not copy public files:`, error)
    }
  }
}

async function copyDirectory(srcDir: string, destDir: string) {
  const items = await readdir(srcDir)

  for (const item of items) {
    const srcPath = join(srcDir, item)
    const destPath = join(destDir, item)
    const itemStat = await stat(srcPath)

    if (itemStat.isDirectory()) {
      await mkdir(destPath, { recursive: true })
      await copyDirectory(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

async function getAllRoutes(
  pagesDirAbs: string,
  basePath = ''
): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = []
  const items = await readdir(pagesDirAbs)

  for (const item of items) {
    const fullPath = join(pagesDirAbs, item)
    const itemStat = await stat(fullPath)

    if (itemStat.isDirectory()) {
      const nestedRoutes = await getAllRoutes(fullPath, join(basePath, item))
      routes.push(...nestedRoutes)
    } else if (item.endsWith('.tsx')) {
      const fileName = item.replace('.tsx', '')
      const routePath = join(basePath, fileName)

      const isDynamic = fileName.startsWith('[') && fileName.endsWith(']')

      if (isDynamic) {
        const dynamicRoutes = await handleDynamicRoute(routePath, fullPath)
        routes.push(...dynamicRoutes)
      } else {
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
  fileAbsPath: string
): Promise<RouteInfo[]> {
  try {
    const module = await import(pathToFileURL(fileAbsPath).href)
    if (!module.generateStaticParams) {
      console.warn(
        `Dynamic route ${routePath} missing generateStaticParams function`
      )
      return []
    }

    const staticParams: GenerateStaticParamsResult[] =
      await module.generateStaticParams()

    return staticParams.map((paramResult) => {
      const fileName = basename(routePath)
      const paramName = fileName.replace('[', '').replace(']', '') || ''
      const paramValue = paramResult.params[paramName]
      const outputPath =
        routePath.replace(`[${paramName}]`, paramValue) + '/index.html'

      return {
        path: routePath,
        outputFile: outputPath,
        isDynamic: true,
        params: paramResult.params,
        props: paramResult.props,
        metadata: paramResult.metadata,
      }
    })
  } catch (error) {
    console.error(`Error handling dynamic route ${routePath}:`, error)
    return []
  }
}

async function generateRoute(
  route: RouteInfo,
  pagesDirAbs: string,
  distDirAbs: string
) {
  const filePath = join(distDirAbs, route.outputFile)
  const dirPath = filePath.split('/').slice(0, -1).join('/')
  if (dirPath) {
    await mkdir(dirPath, { recursive: true })
  }

  const routeFileAbsNoExt = join(pagesDirAbs, route.path)
  const module = await import(pathToFileURL(`${routeFileAbsNoExt}.tsx`).href)
  const { default: Page, metadata: staticMetadata } = module

  const metadata = route.metadata || staticMetadata
  if (!metadata) {
    throw new Error(`Missing metadata in ${routeFileAbsNoExt}.tsx`)
  }

  let pageProps: any = {}
  if (route.isDynamic) {
    pageProps.params = route.params
    if (route.props) {
      Object.assign(pageProps, route.props)
    }
  }

  const pageElement =
    Page && Page.constructor && Page.constructor.name === 'AsyncFunction' ? (
      await Page(pageProps)
    ) : (
      <Page {...pageProps} />
    )

  const html = renderToString(pageElement)
  const document = createHtml({ html, metadata })

  await write(filePath, document)
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

function outputFileToPath(outputFile: string) {
  if (outputFile.endsWith('index.html')) {
    const dir = outputFile.slice(0, -'index.html'.length)
    return '/' + dir
  }
  // Fallback: ensure leading slash
  return '/' + outputFile
}

async function generateSitemap(
  distDirAbs: string,
  routes: RouteInfo[],
  baseUrl: string
) {
  const normalizedBase = normalizeBaseUrl(baseUrl)
  const urls = routes.map((r) => {
    const path = outputFileToPath(r.outputFile)
    const loc = path === '/' ? `${normalizedBase}/` : `${normalizedBase}${path}`
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  await write(join(distDirAbs, 'sitemap.xml'), xml)
}

export type { Metadata } from './html'
export type { GenerateStaticParamsResult } from './types'
