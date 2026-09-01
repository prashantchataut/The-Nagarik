export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse px-4 py-8 md:px-6 md:py-12" aria-busy="true">
      <div className="h-9 w-48 rounded bg-paper-strong" />
      <div className="mt-5 h-12 w-full rounded-[var(--radius-control)] bg-paper-elevated" />
      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-t border-line pt-4">
              <div className="aspect-[16/10] rounded-[var(--radius-control)] bg-paper-strong" />
              <div className="mt-3 h-5 w-full rounded bg-paper-strong" />
              <div className="mt-2 h-4 w-3/4 rounded bg-paper-elevated" />
            </div>
          ))}
        </div>
        <div className="space-y-3 lg:col-span-4 lg:border-l lg:border-line lg:pl-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-11 border-b border-line" />
          ))}
        </div>
      </div>
    </div>
  )
}
