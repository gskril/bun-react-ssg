import { GenerateStaticParamsResult } from 'bun-react-ssg'

import { Layout } from '@/components/Layout'
import { fetchTodos } from '@/utils'

export async function generateStaticParams(): Promise<
  GenerateStaticParamsResult[]
> {
  const todos = await fetchTodos()

  return todos.map((todo) => ({
    params: { id: todo.id.toString() },
    props: { todo },
    metadata: {
      title: `Todo ${todo.id}`,
      description: todo.title,
    },
  }))
}

interface TodoPageProps {
  params: { id: string }
  todo: Awaited<ReturnType<typeof fetchTodos>>[number]
}

async function TodoPage({ todo }: TodoPageProps) {
  return (
    <Layout>
      <h1>Todo #{todo.id}</h1>
      <p>{todo.title}</p>

      <div className="mt-4 mb-1">
        <p className="text-sm text-gray-500">
          Status: {todo.completed ? 'Completed' : 'Pending'}
        </p>
        <p className="text-sm text-gray-500">User ID: {todo.userId}</p>
      </div>

      <a className="text-sm" href="/">
        ← Back to Home
      </a>
    </Layout>
  )
}

export default TodoPage
