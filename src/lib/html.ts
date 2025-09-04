export type Metadata = {
  title: string
  description: string
  opengraph?: {
    image: string
  }
}

type HtmlPageProps = {
  html: string
  metadata: Metadata
}

export function createHtml({ html, metadata }: HtmlPageProps) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${generateMetaTags(metadata)}
      </head>
      <body>
        ${html}
      </body>
    </html>
  `
}

function generateMetaTags({ title, description, opengraph }: Metadata) {
  let tags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
  `

  if (opengraph) {
    tags += `
      <meta property="og:image" content="${opengraph.image}" />
      <meta name="twitter:image" content="${opengraph.image}" />
    `
  }

  return tags
}
