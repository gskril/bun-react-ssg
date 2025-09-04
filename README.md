# Static Site Generator with React and Bun

A super lightweight static site generator that supports both static and dynamic routes, inspired by Next.js pages router.

## Features

- [x] Static route generation
- [x] Dynamic route generation with `[param]` syntax
- [x] Async React components
- [x] HTML minification
- [x] Meta tags and SEO support

## Dynamic Routes

Create dynamic routes using the `[param].tsx` syntax in your pages directory. Dynamic route files must export a `generateStaticParams` function that defines which routes to generate at build time.

### Example: `src/react/pages/todo/[id].tsx`

```tsx
import { Metadata } from '@/lib/html'

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

## Build Commands

```bash
# Development with watch mode
bun run dev

# Production build
bun run build

# Single build
bun run start
```

## Generated Structure

```
dist/
├── index.html              # Static route: pages/index.tsx
├── about/
│   └── index.html         # Static route: pages/about.tsx
└── todo/
    ├── 1/
    │   └── index.html     # Dynamic route: pages/todo/[id].tsx
    ├── 2/
    │   └── index.html
    └── ...
```
