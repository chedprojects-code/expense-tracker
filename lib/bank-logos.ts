import bankLogos from '../data/bank-logos.json'
import { createClient } from '@/lib/supabase/client'

export const BANK_LOGO_BUCKET = 'bank-logos'
export const BANK_LOGOS = bankLogos

export async function uploadBankLogos(): Promise<{ uploaded: number; total: number }> {
  const bucket = createClient().storage.from(BANK_LOGO_BUCKET)
  const { data: existingObjects, error: listError } = await bucket.list('', { limit: 100 })
  if (listError) throw new Error(`Could not check the bank-logo bucket: ${listError.message}`)

  const existingNames = new Set((existingObjects ?? []).map((object) => object.name))
  let uploaded = 0

  for (const logo of BANK_LOGOS) {
    if (existingNames.has(logo.fileName)) continue

    const response = await fetch(`/banks/${logo.fileName}`)
    if (!response.ok) throw new Error(`Could not read ${logo.fileName} from public/banks.`)

    const contentType = logo.fileName.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
    const { error } = await bucket.upload(logo.fileName, await response.blob(), {
      contentType,
      cacheControl: '31536000',
    })
    if (error) throw new Error(`Could not upload ${logo.fileName}: ${error.message}`)
    uploaded += 1
  }

  return { uploaded, total: BANK_LOGOS.length }
}

export function getBankLogoUrl(fileName: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL.')
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${BANK_LOGO_BUCKET}/${fileName}`
}

export function isAccountImage(symbol: string): boolean {
  return symbol.startsWith('data:image/') || /^https?:\/\//.test(symbol)
}

export function getLocalBankLogoUrl(symbol: string): string | undefined {
  const logo = BANK_LOGOS.find(({ fileName }) => symbol.endsWith(`/bank-logos/${fileName}`))
  return logo ? `/banks/${logo.fileName}` : undefined
}
