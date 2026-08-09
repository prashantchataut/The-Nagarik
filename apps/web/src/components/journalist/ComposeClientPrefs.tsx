'use client'

import { useEffect, useState } from 'react'
import {
  ArticleComposer,
  type ComposerInitial,
  type ComposerMediaOption,
  type ComposerOption,
} from '@/components/journalist/ArticleComposer'
import { readJournalistPrefs } from '@/components/journalist/JournalistPreferencesForm'

export function ComposeClientPrefs({
  initial,
  categories,
  authors,
  tags,
  media,
}: {
  initial: ComposerInitial
  categories: ComposerOption[]
  authors: ComposerOption[]
  tags: ComposerOption[]
  media: ComposerMediaOption[]
}) {
  const [prefs, setPrefs] = useState({ compactEditor: false, confirmBeforeSubmit: true })

  useEffect(() => {
    const p = readJournalistPrefs()
    setPrefs({
      compactEditor: p.compactEditor,
      confirmBeforeSubmit: p.confirmBeforeSubmit,
    })
  }, [])

  return (
    <ArticleComposer
      initial={initial}
      categories={categories}
      authors={authors}
      tags={tags}
      media={media}
      compact={prefs.compactEditor}
      confirmBeforeSubmit={prefs.confirmBeforeSubmit}
    />
  )
}
