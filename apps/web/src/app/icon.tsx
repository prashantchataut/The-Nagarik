import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

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
          background: '#E8ECF1',
          color: '#0F6E6A',
          fontSize: 190,
          fontWeight: 700,
          border: '28px solid #0F6E6A',
          fontFamily: 'Noto Serif Devanagari, serif',
        }}
      >
        न
      </div>
    ),
    size,
  )
}
