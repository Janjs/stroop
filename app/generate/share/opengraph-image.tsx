import { ImageResponse } from 'next/og'

export const alt = 'A shared Stroop creation'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#fafafa',
        color: '#242424',
        display: 'flex',
        fontFamily: 'sans-serif',
        height: '100%',
        justifyContent: 'center',
        padding: 72,
        width: '100%',
      }}
    >
      <div
        style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderLeft: '10px solid #f59e0b',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          padding: '58px 64px',
          width: '100%',
        }}
      >
        <div style={{ color: '#6b7280', display: 'flex', fontSize: 26 }}>♫ Shared Stroop creation</div>
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 700 }}>Listen to this Stroop</div>
        <div style={{ color: '#6b7280', display: 'flex', fontSize: 30 }}>
          A playable Strudel pattern made with Stroop.
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
          <div style={{ background: '#f59e0b', borderRadius: 999, height: 18, width: 18 }} />
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 600 }}>stroop</div>
        </div>
      </div>
    </div>,
    size,
  )
}
