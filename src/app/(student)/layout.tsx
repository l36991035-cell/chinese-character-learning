export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen paper-grid">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
