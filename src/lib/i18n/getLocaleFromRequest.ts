import type { NextRequest } from 'next/server'
import type { Locale } from './index'

/**
 * Determine locale from request using priority:
 * 1. lang cookie (explicit user choice)
 * 2. Accept-Language header (browser preference)
 * 3. Default: 'en'
 */
export function getLocaleFromRequest(request: NextRequest): Locale {
  // 1. Cookie
  const cookieLang = request.cookies.get('lang')?.value
  if (cookieLang === 'th' || cookieLang === 'en') return cookieLang

  // 2. Accept-Language header
  const acceptLang = request.headers.get('accept-language') ?? ''
  if (acceptLang.toLowerCase().includes('th')) return 'th'

  return 'en'
}
