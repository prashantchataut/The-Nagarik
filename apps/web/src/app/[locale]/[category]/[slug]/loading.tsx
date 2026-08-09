export default function ArticleLoading() {
  return (
    <article className="animate-pulse px-4 py-8 md:px-6 md:py-12" aria-hidden="true">
      <div className="mx-auto max-w-[800px]">
        <div className="h-3 w-28 bg-line" />
        <div className="mt-4 h-12 w-full bg-line" />
        <div className="mt-3 h-12 w-5/6 bg-line" />
        <div className="mt-5 h-5 w-3/4 bg-line" />
        <div className="mt-4 h-3 w-56 bg-line" />
      </div>
      <div className="mx-auto mt-8 aspect-[16/9] max-w-[1080px] bg-line" />
      <div className="mx-auto mt-9 max-w-[720px] space-y-4">
        {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className={`h-4 bg-line ${item % 3 === 2 ? 'w-4/5' : 'w-full'}`} />)}
      </div>
    </article>
  )
}
