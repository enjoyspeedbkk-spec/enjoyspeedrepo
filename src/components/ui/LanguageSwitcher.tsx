'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const router = useRouter()

  const handleSwitch = (newLocale: Locale) => {
    setLocale(newLocale)
    // Refresh server components so they re-render with the new locale cookie
    router.refresh()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm border border-sand px-3 py-2 shadow-lg text-sm font-medium select-none">
      <button
        onClick={() => handleSwitch('en')}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          locale === 'en'
            ? 'bg-ink text-cream'
            : 'text-ink/50 hover:text-ink'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-sand">·</span>
      <button
        onClick={() => handleSwitch('th')}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          locale === 'th'
            ? 'bg-ink text-cream'
            : 'text-ink/50 hover:text-ink'
        }`}
        aria-label="เปลี่ยนเป็นภาษาไทย"
      >
        TH
      </button>
    </div>
  )
}
