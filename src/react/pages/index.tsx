import { Metadata } from '@/lib/html'

export const metadata: Metadata = {
  title: 'Home',
  description: 'This is a home page',
}

async function HomePage() {
  const todosRes = await fetch('https://jsonplaceholder.typicode.com/todos')

  const todos = (await todosRes.json()) as Array<{
    userId: number
    id: number
    title: string
    completed: boolean
  }>

  return (
    <div>
      <h1>Welcome to the Home Page</h1>

      <h2>Todos</h2>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}

export default HomePage
