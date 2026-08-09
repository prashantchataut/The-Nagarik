'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function JournalistError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[journalist-error]', error.digest ?? error.message)
  }, [error])

  return (
    <div className="mx-auto max-w-[760px] border-y border-line py-14">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-danger">सम्पादकीय त्रुटि</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.025em]">यो सम्पादकीय दृश्य खोल्न सकिएन</h1>
      <p className="mt-3 max-w-[58ch] text-sm leading-7 text-stone">
        तपाईंको लेख सुरक्षित छ कि छैन भनेर पुष्टि नगरी पृष्ठ बन्द नगर्नुहोस्। यो दृश्य पुनः लोड गर्न सकिन्छ; समस्या दोहोरिए प्रणाली प्रशासकलाई जानकारी दिनुहोस्।
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="min-h-11 rounded-[var(--radius-control)] bg-accent px-4 text-sm font-bold text-accent-fg">
          फेरि प्रयास गर्नुहोस्
        </button>
        <Link href="/journalist" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-paper px-4 text-sm font-semibold hover:border-accent hover:text-accent">
          मेरो डेस्क
        </Link>
      </div>
    </div>
  )
}
