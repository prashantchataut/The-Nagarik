/** Dashed ad placeholders for client pitch demos */
export function AdSlot({
  label = 'Advertisement',
  variant = 'leaderboard',
  className = '',
}: {
  label?: string
  variant?: 'leaderboard' | 'infeed' | 'sidebar'
  className?: string
}) {
  const size =
    variant === 'sidebar'
      ? 'min-h-[250px] max-w-[300px]'
      : variant === 'infeed'
        ? 'min-h-[90px] w-full'
        : 'min-h-[90px] w-full max-w-[970px]'

  return (
    <div
      className={`mx-auto flex items-center justify-center border border-dashed border-line bg-paper-elevated text-xs text-stone ${size} ${className}`}
      role="presentation"
      aria-hidden
    >
      {label}
    </div>
  )
}
