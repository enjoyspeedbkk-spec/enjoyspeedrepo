# En-Joy Speed i18n Translation Files

## Overview
Complete internationalization (i18n) translation files for the En-Joy Speed cycling booking platform. These files support both English and Thai languages for ~50% Thai users and ~50% foreign tourists.

## Files
- **en.json** (37 KB) - English translations of all user-facing strings
- **th.json** (73 KB) - Thai translations of all user-facing strings

## Translation Organization
Both files are structured by component/feature for easy maintenance:

```
{
  "common": { ... },
  "nav": { ... },
  "hero": { ... },
  "packages": { ... },
  "howItWorks": { ... },
  "gallery": { ... },
  "timeSlots": { ... },
  "whatsIncluded": { ... },
  "faq": { ... },
  "cta": { ... },
  "testimonials": { ... },
  "about": { ... },
  "contact": { ... },
  "booking": { ... },
  "payment": { ... },
  "account": { ... },
  "auth": { ... },
  "bookings": { ... },
  "review": { ... },
  "survey": { ... },
  "footer": { ... },
  "privacy": { ... },
  "terms": { ... },
  "errors": { ... }
}
```

## Translation Guidelines Applied

### Brand & Product Names
- Always kept in English: "En-Joy Speed", "Skylane", "LINE", "PromptPay"
- Package names kept in English with Thai parenthetical translations

### Thai Language Tone
- Friendly and approachable (conversational, not bureaucratic)
- Used "คุณ" (khun) for polite "you"
- Used "ครับ/ค่ะ" sparingly (only in conversational prompts)
- Formal Thai for legal/waiver text

### Numbers & Dates
- Arabic numerals used (not Thai numerals)
- Buddhist calendar year: add 543 to Western year (2026 = 2569)
- Currency: "บาท" or "THB" used consistently

### Role Translations
- "Athlete Leader" → "ผู้นำทีม" (team leader)
- "Hero Rider" → "ผู้ช่วยดูแล" (support helper)
- "Book a Ride" → "จองเลย" (book now)

## Coverage
✅ **100% of user-facing strings extracted**, including:
- Navigation & header/footer
- Homepage hero, packages, testimonials
- How It Works & gallery
- FAQ & contact
- Booking flow (6 steps)
- Payment & waiver
- Account management & auth
- Reviews & surveys
- Legal pages (privacy & terms)
- All error messages

## Integration
To use these files in your Next.js app:

```typescript
// Example: components/i18n.ts
import en from '@/i18n/locales/en.json'
import th from '@/i18n/locales/th.json'

const translations = { en, th }

export function t(key: string, lang: 'en' | 'th') {
  return key.split('.').reduce((obj, k) => obj?.[k], translations[lang])
}
```

## Quality Checks
✅ Valid JSON syntax (both files)
✅ Matching key structure between English and Thai
✅ All strings from codebase included
✅ Appropriate tone and cultural context
✅ Consistent terminology across both languages
