import type { ReactNode } from 'react'
import { JournalistShell } from '@/components/journalist/JournalistShell'
import { requireContributorSession } from '@/lib/journalist/session'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

export default async function JournalistLayout({ children }: { children: ReactNode }) {
  const session = await requireContributorSession('/journalist')

  if (!payloadDeskAvailable()) {
    return (
      <JournalistShell session={session}>
        <div className="mx-auto max-w-[760px] border-y border-line py-14">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-warning">सम्पादकीय सेवा अनुपलब्ध</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.025em]">सम्पादकीय सेवा अहिले उपलब्ध छैन</h1>
          <p className="mt-3 max-w-[58ch] text-sm leading-7 text-stone">
            सम्पादकीय जडान उपलब्ध नभएकाले लेख, समीक्षा कतार र तस्बिर भण्डार अहिले खोल्न सकिएन। केही समयपछि पुनः प्रयास गर्नुहोस् वा प्रणाली प्रशासकलाई जानकारी दिनुहोस्।
          </p>
        </div>
      </JournalistShell>
    )
  }

  return <JournalistShell session={session}>{children}</JournalistShell>
}
