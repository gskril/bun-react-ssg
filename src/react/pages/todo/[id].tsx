import { Metadata } from '@/lib/html'
import { fetchTodos } from '@/react/utils'

export const metadata: Metadata = {
  title: 'Todo Item',
  description: 'Individual todo item page',
}

// This function defines which dynamic routes to generate at build time
export async function generateStaticParams() {
  const todos = await fetchTodos()

  return todos.map((todo) => ({
    params: { id: todo.id.toString() },
    // Optional: provide additional data to avoid re-fetching
    props: { todo },
  }))
}

interface TodoPageProps {
  params: { id: string }
  todo?: Awaited<ReturnType<typeof fetchTodos>>[number]
}

async function TodoPage({ todo }: TodoPageProps) {
  if (!todo) {
    return (
      <div>
        <h1>Todo Not Found</h1>
        <p>The requested todo could not be found.</p>
        <a href="/">← Back to Home</a>
      </div>
    )
  }

  return (
    <div>
      <h1>Todo #{todo.id}</h1>
      <div>
        <h2>{todo.title}</h2>
        <p>Status: {todo.completed ? 'Completed' : 'Pending'}</p>
        <p>User ID: {todo.userId}</p>
      </div>
      <a href="/">← Back to Home</a>
    </div>
  )
}

export default TodoPage
