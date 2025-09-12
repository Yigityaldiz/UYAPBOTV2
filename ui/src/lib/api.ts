import type { Tebligat } from '../types'
import { mockTebligatlar } from '../mock/tebligatlar'

const base = (import.meta as any).env?.VITE_API_BASE_URL || ''

export async function getTebligatlar(): Promise<Tebligat[]> {
  try {
    const res = await fetch(`${base}/api/tebligatlar`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data as Tebligat[]
  } catch (e) {
    console.warn('API çağrısı başarısız, mock veri kullanılacak:', e)
    return mockTebligatlar
  }
}

export function parseTRDate(input?: string): Date | null {
  if (!input) return null
  // desteklenen örnekler: 14/10/2025, 14.10.2025, 2025-10-14
  const s = input.trim()
  const m1 = s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/)
  if (m1) {
    const [_, dd, mm, yyyy] = m1
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export function daysUntil(date: Date | null): number | null {
  if (!date) return null
  const ms = date.getTime() - Date.now()
  return Math.ceil(ms / (24 * 3600 * 1000))
}

