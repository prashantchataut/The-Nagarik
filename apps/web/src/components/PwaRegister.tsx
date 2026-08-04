'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Keep silent in UI; registration can fail in dev.
    })
  }, [])

  return null
}
