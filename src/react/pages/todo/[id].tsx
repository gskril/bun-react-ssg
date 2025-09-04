import { GenerateStaticParamsResult } from '@/lib/types'
import { fetchTodos } from '@/react/utils'

// This function defines which dynamic routes to generate at build time
export async function generateStaticParams(): Promise<
  GenerateStaticParamsResult[]
> {
  const todos = await fetchTodos()

  return todos.map((todo) => ({
    params: { id: todo.id.toString() },
    // Optional: provide additional data to avoid re-fetching
    props: { todo },
    metadata: {
      title: `Todo ${todo.id}`,
      description: todo.title,
    },
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
