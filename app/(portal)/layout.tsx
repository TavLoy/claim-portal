import Image from 'next/image'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/tavloy-logo-gold.png" alt="TavLoy" width={110} height={54} className="h-8 w-auto" priority />
          <span className="text-sm font-normal text-gray-400">· Internal portal</span>
        </div>
        <span className="text-xs text-gray-400">Blackjack Media Ltd</span>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
