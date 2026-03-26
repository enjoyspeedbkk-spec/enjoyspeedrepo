import en from '@/i18n/locales/en.json'
import th from '@/i18n/locales/th.json'

export type Locale = 'en' | 'th'
export const locales: Locale[] = ['en', 'th']
export const defaultLocale: Locale = 'en'

const messages = { en, th } as const

type MessageValue = string | number | boolean | MessageObject | MessageArray
interface MessageObject { [key: string]: MessageValue }
type MessageArray = MessageValue[]

/**
 * Resolve a dot-notation key against a nested object or array.
 * Supports numeric indices for arrays: e.g. "faq.questions.0.q"
 */
function resolve(obj: MessageObject, key: string): string | undefined {
  const parts = key.split('.')
  let current: MessageValue = obj
  for (const part of parts) {
    if (current == null) return undefined
    if (Array.isArray(current)) {
      const idx = parseInt(part, 10)
      if (isNaN(idx) || idx < 0 || idx >= (current as MessageArray).length) return undefined
      current = (current as MessageArray)[idx]
    } else if (typeof current === 'object') {
      current = (current as MessageObject)[part]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : typeof current === 'number' ? String(current) : undefined
}

/**
 * Get a translation string. Falls back to English if Thai key missing.
 * Supports variable interpolation: t('key', {name: 'Ryan'}) replaces {name} in string.
 */
export function getTranslation(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = messages[locale] as unknown as MessageObject
  let value = resolve(dict, key)

  // Fallback to English
  if (value == null && locale !== 'en') {
    value = resolve(messages.en as unknown as MessageObject, key)
  }

  if (value == null) return key // last resort: return key itself

  // Interpolate variables
  if (vars) {
    value = value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
  }

  return value
}

export { messages }
