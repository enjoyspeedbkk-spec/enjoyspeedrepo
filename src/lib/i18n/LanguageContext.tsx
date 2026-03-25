'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Locale } from './index'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

interface LanguageProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function LanguageProvider({ children, initialLocale = 'en' }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    // Persist to cookie (1 year)
    document.cookie = `lang=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    // Lazy import to avoid circular deps — we call the pure function
    const { getTranslation } = require('./index')
    return getTranslation(locale, key, vars)
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
