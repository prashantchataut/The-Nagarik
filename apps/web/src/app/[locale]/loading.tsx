export default function HomepageLoading() {
  return (
    <div className="mx-auto max-w-[1280px] animate-pulse px-4 py-6 md:px-6 md:py-8" aria-hidden="true">
      {/* Breaking Ticker Skeleton */}
      <div className="h-10 w-full rounded-[var(--radius-control)] bg-line/60 mb-6" />

      {/* Hero Lead Skeleton */}
      <div className="grid gap-8 lg:grid-cols-12 mb-10">
        <div className="lg:col-span-8 space-y-4">
          <div className="aspect-[16/9] w-full rounded-[var(--radius-panel)] bg-line/70" />
          <div className="h-4 w-28 bg-line" />
          <div className="h-10 w-full bg-line" />
          <div className="h-4 w-3/4 bg-line" />
          <div className="h-3 w-48 bg-line" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-6 w-32 bg-line mb-3" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 border-b border-line/50 pb-3">
              <div className="h-3 w-20 bg-line/70" />
              <div className="h-4 w-full bg-line" />
              <div className="h-3 w-28 bg-line/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Trending Section Skeleton */}
      <div className="mb-10 space-y-4">
        <div className="h-7 w-36 bg-line" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[var(--radius-panel)] border border-line p-3 space-y-2.5">
              <div className="aspect-[16/10] w-full rounded bg-line/70" />
              <div className="h-4 w-full bg-line" />
              <div className="h-3 w-20 bg-line/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Category Band Skeleton */}
      <div className="space-y-4">
        <div className="h-7 w-40 bg-line" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-3">
            <div className="aspect-[16/9] w-full rounded-[var(--radius-panel)] bg-line/70" />
            <div className="h-6 w-full bg-line" />
            <div className="h-4 w-2/3 bg-line" />
          </div>
          <div className="lg:col-span-5 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_6.5rem] gap-3 border-b border-line/50 pb-3">
                <div className="space-y-2">
                  <div className="h-4 w-full bg-line" />
                  <div className="h-3 w-20 bg-line/60" />
                </div>
                <div className="aspect-[4/3] rounded bg-line/70" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
