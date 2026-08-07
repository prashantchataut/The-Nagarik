/** Design tokens for The Nagarik portal. Import via `@thenagarik/ui/tokens.css`. */
export const portalTokens = {
  paper: '#ffffff',
  paperElevated: '#f3f5f7',
  ink: '#0c0e12',
  stone: '#3d4654',
  line: '#c5ccd6',
  accent: '#0b5a56',
  accentFg: '#ffffff',
  accentMuted: '#e6f3f2',
  holiday: '#b80f18',
  radiusControl: '4px',
} as const

export type PortalTokens = typeof portalTokens
