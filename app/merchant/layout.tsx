export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900">商户中心 - 易宿酒店</h1>
          <nav className="flex gap-4">
            <a
              href="/merchant/hotels"
              className="text-zinc-600 hover:text-zinc-900"
            >
              酒店列表
            </a>
            <a
              href="/merchant/hotels/new"
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
            >
              新增酒店
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
