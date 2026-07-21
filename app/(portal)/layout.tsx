export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">
          Tav<span className="text-emerald-600">Loy</span>
          <span className="ml-2 text-sm font-normal text-gray-400">· Internal portal</span>
        </span>
        <span className="text-xs text-gray-400">Blackjack Media Ltd</span>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
