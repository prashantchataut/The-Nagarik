export default function LatestLoading() {
  return (
    <div className="mx-auto max-w-[1280px] animate-pulse px-4 py-8 md:px-6 md:py-12" aria-busy="true">
      <div className="border-b-2 border-line pb-6">
        <div className="h-3 w-36 rounded bg-paper-strong" />
        <div className="mt-3 h-10 w-64 max-w-full rounded bg-paper-strong" />
        <div className="mt-3 h-5 w-[34rem] max-w-full rounded bg-paper-elevated" />
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="aspect-[16/9] rounded-[var(--radius-panel)] bg-paper-strong lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1fr_8rem] gap-4 border-b border-line pb-4">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-paper-strong" />
                <div className="h-5 w-full rounded bg-paper-strong" />
                <div className="h-5 w-4/5 rounded bg-paper-strong" />
              </div>
              <div className="aspect-[4/3] rounded-[var(--radius-control)] bg-paper-strong" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
