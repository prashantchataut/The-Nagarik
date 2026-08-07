import Link from 'next/link'

export function CategoryTag({
  href,
  children,
  className = '',
}: {
  href?: string
  children: React.ReactNode
  className?: string
}) {
  const cls = `inline-block rounded-[var(--radius-control)] bg-accent px-2.5 py-1 text-[0.8rem] font-semibold leading-none text-accent-fg ${className}`
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return <span className={cls}>{children}</span>
}
