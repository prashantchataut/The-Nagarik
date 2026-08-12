/**
 * Email service status. The adapter itself is wired in payload.config
 * (nodemailer over SMTP_* env); without SMTP config Payload logs emails to
 * the console, which is fine for dev and useless in production - so
 * password-reset UX and launch readiness both key off `emailConfigured()`.
 */
export function emailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.EMAIL_FROM?.trim(),
  )
}

/** Sender identity; falls back to a no-reply on the site domain. */
export function emailFrom(siteDomain: string): string {
  return process.env.EMAIL_FROM?.trim() || `no-reply@${siteDomain}`
}

/**
 * Minimal branded HTML shell for transactional emails. Table layout +
 * inline styles: the lowest common denominator across email clients.
 */
export function transactionalHtml(options: {
  siteName: string
  heading: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote: string
}): string {
  const cta =
    options.ctaLabel && options.ctaUrl
      ? `<tr><td style="padding:24px 0 8px">
           <a href="${options.ctaUrl}"
              style="display:inline-block;background:#0b6b63;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:8px;font-size:16px">
             ${options.ctaLabel}
           </a>
         </td></tr>
         <tr><td style="padding:4px 0;color:#57534e;font-size:13px;word-break:break-all">
           ${options.ctaUrl}
         </td></tr>`
      : ''
  return `<!doctype html>
<html lang="ne">
<body style="margin:0;padding:0;background:#f5f5f4">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;padding:32px;font-family:'Noto Sans Devanagari','Noto Sans',Arial,sans-serif;color:#1c1917;line-height:1.7">
        <tr><td style="font-size:20px;font-weight:800;padding-bottom:16px">${options.siteName}</td></tr>
        <tr><td style="font-size:17px;font-weight:700;padding-bottom:8px">${options.heading}</td></tr>
        <tr><td style="font-size:15px;color:#44403c">${options.bodyHtml}</td></tr>
        ${cta}
        <tr><td style="padding-top:24px;border-top:1px solid #e7e5e4;margin-top:24px;font-size:12px;color:#78716c">
          ${options.footerNote}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
