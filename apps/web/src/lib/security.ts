import { timingSafeEqual } from 'node:crypto'

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function assertCronAuth(header: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 32) return false
  if (!header?.startsWith('Bearer ')) return false
  return safeEqual(header.slice(7), secret)
}

export function assertRevalidateAuth(header: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || secret.length < 32) return false
  if (!header?.startsWith('Bearer ')) return false
  return safeEqual(header.slice(7), secret)
}
