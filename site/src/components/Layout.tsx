export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <div className="p-6 max-w-xl mx-auto border border-gray-200 rounded-md">
        {children}
      </div>
    </div>
  )
}
