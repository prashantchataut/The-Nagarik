import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

/** Latin mark only - Edge ImageResponse cannot reliably render Devanagari without a bundled font. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F6E6A',
          color: '#F4F6F9',
          fontSize: 280,
          fontWeight: 700,
          letterSpacing: '-0.06em',
          fontFamily: 'Georgia, Times New Roman, serif',
        }}
      >
        N
      </div>
    ),
    { ...size },
  )
}
