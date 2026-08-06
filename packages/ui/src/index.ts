/** Design tokens for The Nagarik portal. Import via `@thenagarik/ui/tokens.css`. */
export const portalTokens = {
  paper: '#ffffff',
  paperElevated: '#f7f8fa',
  ink: '#111111',
  stone: '#5c6570',
  line: '#e5e7eb',
  accent: '#0f6e6a',
  accentFg: '#ffffff',
  holiday: '#d10b15',
  radiusControl: '4px',
} as const

export type PortalTokens = typeof portalTokens
