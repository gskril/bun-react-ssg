import { Metadata } from 'bun-react-ssg'

import { Layout } from '@/components/Layout'

import { fetchTodos } from '../utils'

export const metadata: Metadata = {
  title: 'Home',
  description: 'This is a home page',
}

async function HomePage() {
  const todos = await fetchTodos()

  return (
    <Layout>
      <h1>Welcome to the Home Page</h1>

      <h2>Todos</h2>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <a href={`/todo/${todo.id}/`}>{todo.title}</a>
            {todo.completed && <span> ✓</span>}
          </li>
        ))}
      </ul>
    </Layout>
  )
}

export default HomePage
