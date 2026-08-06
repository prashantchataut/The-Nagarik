/** Skeleton placeholders matching portal feed / desk shapes */
export function FeedSkeleton() {
  return (
    <div className="mx-auto max-w-[1210px] animate-pulse space-y-10 px-4 py-10" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 text-center">
          <div className="mx-auto h-6 w-24 rounded-[var(--radius-control)] bg-line" />
          <div className="mx-auto h-10 w-3/4 max-w-xl bg-line" />
          <div className="mx-auto h-4 w-40 bg-line" />
          <div className="aspect-[16/9] w-full bg-line md:aspect-[2/1]" />
        </div>
      ))}
    </div>
  )
}

export function DeskSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1240px] animate-pulse gap-6 px-4 py-8 md:grid-cols-2" aria-hidden>
      <div className="space-y-3">
        <div className="h-6 w-40 border-b-2 border-line bg-transparent pb-2" />
        <div className="aspect-[16/10] bg-line" />
        <div className="h-5 w-full bg-line" />
        <div className="h-4 w-2/3 bg-line" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-32 bg-line" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 border-b border-line py-2">
            <div className="h-16 w-20 shrink-0 bg-line" />
            <div className="h-4 flex-1 self-center bg-line" />
          </div>
        ))}
      </div>
    </div>
  )
}
