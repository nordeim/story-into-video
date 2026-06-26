import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Dynamic favicon — amber "S" on near-black background.
 * Matches the brand identity: #020202 bg + #febf00 accent.
 * Generated at build time via Next.js's ImageResponse (no static file needed).
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#020202',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#febf00',
        fontSize: 22,
        fontWeight: 800,
        fontFamily: 'sans-serif',
      }}
    >
      S
    </div>,
    { ...size },
  );
}
