import { write } from 'bun'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { renderToString } from 'react-dom/server'

import { createHtml } from './html'
import type { GenerateStaticParamsResult } from './types'

export type BuildSiteOptions = {
  pagesDir: string // e.g., 'src/pages'
  distDir?: string // e.g., 'dist'
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
}: BuildSiteOptions) {
  const startTime = Date.now()

  const absolutePagesDir = resolve(pagesDir)
  const absoluteDistDir = resolve(distDir)

  await mkdir(absoluteDistDir, { recursive: true })

  const routes = await getAllRoutes(absolutePagesDir, '')

  for (const route of routes) {
    await generateRoute(route, absolutePagesDir, absoluteDistDir)
  }

  const duration = Date.now() - startTime
  console.log(`Generated ${routes.length} static files in ${duration}ms`)
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

export type { Metadata } from './html'
export type { GenerateStaticParamsResult } from './types'
