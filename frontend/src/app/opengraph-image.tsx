import { ImageResponse } from 'next/og';

/**
 * Social preview card (1200x630 — the 1.91:1 size Slack, Telegram and the
 * OpenGraph scrapers crop to). DataCat shipped no og:image, so every shared
 * link rendered as a blank grey rectangle.
 *
 * Satori cannot read CSS custom properties or Tailwind classes, so the accent
 * is repeated here as a literal. It mirrors the indigo-600 used across the app.
 */

export const runtime = 'edge';
export const alt = 'DataCat — KI-gestützter Formular-Editor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#171717';
const INDIGO = '#4F46E5';
const MUTED = '#6B7280';
const PAPER = '#FFFFFF';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: PAPER,
        padding: '72px 80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{ width: 18, height: 18, borderRadius: 5, background: INDIGO, display: 'flex' }}
        />
        <div style={{ fontSize: 30, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
          DataCat
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: INK,
            maxWidth: 980,
          }}
        >
          Formulare, die mitdenken
        </div>
        <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.35, color: MUTED, maxWidth: 900 }}>
          Erstellen Sie schöne, intelligente Formulare für jede Branche — nicht nur HR.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{ width: 64, height: 5, borderRadius: 999, background: INDIGO, display: 'flex' }}
        />
        <div style={{ fontSize: 24, color: MUTED }}>datacat.orangecat.ch</div>
      </div>
    </div>,
    { ...size },
  );
}
