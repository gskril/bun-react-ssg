import { buildSite } from 'bun-react-ssg'

await buildSite({ pagesDir: 'src/pages', distDir: 'dist' })
