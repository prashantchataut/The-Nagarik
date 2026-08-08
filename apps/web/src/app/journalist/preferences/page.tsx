import { JournalistPreferencesForm } from '@/components/journalist/JournalistPreferencesForm'

export const metadata = {
  title: 'Preferences · Journalist desk',
  robots: { index: false, follow: false },
}

export default function JournalistPreferencesPage() {
  return (
    <div>
      <p className="text-sm font-semibold text-accent">सेटिङ</p>
      <h1 className="mt-1 text-3xl font-bold">Editor preferences</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Device-local settings for the compose desk. Account roles stay in Payload Users.
      </p>
      <div className="mt-8">
        <JournalistPreferencesForm />
      </div>
    </div>
  )
}
