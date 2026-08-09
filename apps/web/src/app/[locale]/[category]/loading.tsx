export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-[1120px] animate-pulse px-4 py-8 md:px-6 md:py-12" aria-hidden="true">
      <div className="h-3 w-20 bg-line" />
      <div className="mt-3 h-11 w-60 bg-line" />
      <div className="mt-8 divide-y divide-line border-y border-line">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="grid gap-4 py-5 sm:grid-cols-[9rem_1fr]">
            <div className="aspect-[4/3] bg-line" />
            <div className="space-y-3 py-1">
              <div className="h-5 w-5/6 bg-line" />
              <div className="h-4 w-full bg-line" />
              <div className="h-3 w-32 bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
