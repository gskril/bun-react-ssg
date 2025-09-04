export async function fetchTodos() {
  const todosRes = await fetch('https://jsonplaceholder.typicode.com/todos')
  const todos = (await todosRes.json()) as Array<{
    userId: number
    id: number
    title: string
    completed: boolean
  }>

  return todos
}
