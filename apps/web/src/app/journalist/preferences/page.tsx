import { JournalistPreferencesForm } from '@/components/journalist/JournalistPreferencesForm'

export const metadata = {
  title: 'लेखन सेटिङ · पत्रकार डेस्क',
  robots: { index: false, follow: false },
}

export default function JournalistPreferencesPage() {
  return (
    <div className="mx-auto max-w-[1040px]">
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-stone">
        पत्रकार डेस्क / सेटिङ
      </nav>
      <header className="mt-4 border-b border-line pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">यो उपकरणका सेटिङ</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.025em]">लेखन सेटिङ</h1>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-stone">
          लेखन अनुभवलाई यो उपकरणअनुसार मिलाउनुहोस्। सम्पादकीय अनुमति र खाता सुरक्षा यहाँ परिवर्तन हुँदैन।
        </p>
      </header>
      <div className="mt-7">
        <JournalistPreferencesForm />
      </div>
    </div>
  )
}
