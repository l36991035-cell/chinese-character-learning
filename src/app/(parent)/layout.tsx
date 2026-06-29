export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen paper-grid">
      <nav className="bg-card border-b border-gold">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-ink font-serif">生字學習系統</span>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
