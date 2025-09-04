import { Metadata } from '@/lib/html'

import { fetchTodos } from '../utils'

export const metadata: Metadata = {
  title: 'Home',
  description: 'This is a home page',
}

async function HomePage() {
  const todos = await fetchTodos()

  return (
    <div>
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
    </div>
  )
}

export default HomePage
