# Static Site Generator with React and Bun

A _super_ lightweight static site generator that probably shouldn't be used in production. It's like a less flexible version of [Astro](https://astro.build/) that natively uses React and doesn't support client components.

## Features

- [x] Static route generation
- [x] Dynamic route generation with `[param]` syntax
- [x] Meta tags and SEO support
- [x] Tailwind CSS support
- [x] Auto generating sitemap.xml

## Dynamic Routes

Create dynamic routes using the `[param].tsx` syntax in your pages directory. Dynamic route files must export a `generateStaticParams` function that defines which routes to generate at build time.

### Example: `src/react/pages/todo/[id].tsx`

```tsx
import { Metadata } from 'bun-react-ssg'

export const metadata: Metadata = {
  title: 'Todo Item',
  description: 'Individual todo item page',
}

// Define which dynamic routes to generate
export async function generateStaticParams() {
  const todos = await fetch('https://api.example.com/todos').then((r) =>
    r.json()
  )

  return todos.map((todo) => ({
    params: { id: todo.id.toString() },
    // Optional: provide data to avoid re-fetching
    props: { todo },
  }))
}

// Page component receives params and optional props
async function TodoPage({ params, todo }) {
  // Access dynamic parameter
  const todoId = params.id

  // Use provided data or fetch if needed
  const todoData = todo || (await fetchTodo(todoId))

  return (
    <div>
      <h1>Todo #{todoData.id}</h1>
      <p>{todoData.title}</p>
    </div>
  )
}

export default TodoPage
```

## Scripts

Within the `site` directory, run three separate terminal processes for a dev environment (I know this is annoying, and should probably use Turborepo instead):

```bash
# Rebuild files on change
bun run dev

# Serve the built files (you'll want to run this in a separate terminal during development)
bun run serve

# Rebuild css on Tailwind change
bun run css:watch
```

To build the site into a dist directory for production, run:

```bash
bun run build
```

### Sitemap generation

Provide a base site URL to generate `sitemap.xml` during build:

```bash
bun-react-ssg build --url https://example.com
```

If `--url` is omitted, sitemap generation is skipped and a warning is printed.

When a sitemap is generated, a `robots.txt` file is also created in the same `dist` directory that includes a `Sitemap:` directive pointing to the generated sitemap.

## Generated Structure

```
dist/
├── index.html             # Static route: pages/index.tsx
├── about/
│   └── index.html         # Static route: pages/about.tsx
└── todo/
    ├── 1/
    │   └── index.html     # Dynamic route: pages/todo/[id].tsx
    ├── 2/
    │   └── index.html
    └── ...
```
