'use client'

import type { ElementType } from 'react'
import {
  AirplaneTilt,
  Bank,
  BookOpen,
  CalendarBlank,
  Camera,
  ChartLineUp,
  ChatCircleDots,
  Clock,
  FilmStrip,
  FirstAid,
  Flame,
  Globe,
  House,
  Lightning,
  MapTrifold,
  Newspaper,
  Trophy,
} from '@phosphor-icons/react'

const ICON_MAP: Record<string, ElementType> = {
  home: House,
  samachar: Newspaper,
  rajniti: Bank,
  arth: ChartLineUp,
  pradesh: MapTrifold,
  bichar: ChatCircleDots,
  khel: Trophy,
  bishwa: Globe,
  pravas: AirplaneTilt,
  manranjan: FilmStrip,
  shiksha: BookOpen,
  swasthya: FirstAid,
  patro: CalendarBlank,
  latest: Lightning,
  trending: Flame,
  visual: Camera,
  clock: Clock,
}

export function CategoryIcon({
  slug,
  size = 18,
  weight = 'bold',
  className = '',
  ariaHidden = true,
}: {
  slug: string
  size?: number
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  className?: string
  ariaHidden?: boolean
}) {
  const normalized = slug.toLowerCase().trim()
  const IconComponent = ICON_MAP[normalized] ?? Newspaper
  return <IconComponent size={size} weight={weight} className={className} aria-hidden={ariaHidden} />
}
