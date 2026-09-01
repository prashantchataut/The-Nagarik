import { JournalistProfileForm } from '@/components/journalist/JournalistProfileForm'

export const metadata = {
  title: 'मेरो प्रोफाइल · पत्रकार डेस्क',
  robots: { index: false, follow: false },
}

export default function JournalistProfilePage() {
  return (
    <div className="mx-auto max-w-[1040px]">
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-stone">
        पत्रकार डेस्क / प्रोफाइल
      </nav>
      <header className="mt-4 border-b border-line pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
          सार्वजनिक बाइलाइन पहिचान
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.025em]">मेरो प्रोफाइल</h1>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-stone">
          नेपाली र अंग्रेजी परिचय, प्रोफाइल तस्बिर र बिट विशेषज्ञता यहाँ व्यवस्थापन गर्नुहोस्। यी
          विवरण लेखको बाइलाइन र लेखक पृष्ठमा सार्वजनिक देखिन्छन्।
        </p>
      </header>
      <div className="mt-7">
        <JournalistProfileForm />
      </div>
    </div>
  )
}
