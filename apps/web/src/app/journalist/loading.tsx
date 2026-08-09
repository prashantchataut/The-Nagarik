export default function JournalistLoading() {
  return (
    <div className="mx-auto max-w-[1220px] animate-pulse" aria-label="सम्पादकीय डेस्क लोड हुँदैछ" aria-busy="true">
      <div className="h-3 w-32 bg-line" />
      <div className="mt-4 h-9 w-72 max-w-[70%] bg-line" />
      <div className="mt-3 h-4 w-[32rem] max-w-full bg-line" />
      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="h-64 border border-line bg-paper-elevated" />
          <div className="h-96 border border-line bg-paper-elevated" />
        </div>
        <div className="space-y-4">
          <div className="h-48 border border-line bg-paper-elevated" />
          <div className="h-40 border border-line bg-paper-elevated" />
          <div className="h-36 border border-line bg-paper-elevated" />
        </div>
      </div>
      <span className="sr-only">सम्पादकीय डेस्क लोड हुँदैछ।</span>
    </div>
  )
}
