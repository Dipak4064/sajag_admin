'use client';

import { useId } from 'react';

/*
  SAJAG identity mark.

  Classical: an eight-pointed star (ashtakona) — the rotated-square geometry
  found in Newar temple plans and mandala layouts — carrying the Devanagari
  स of सजग ("vigilant") on a solid disc.
  Modern: one flat gradient, no ornament, regular vertices.

  Built on a 32x32 grid with an 8.6r disc, which keeps the letter readable down
  to about 20px — the smallest place it appears in the UI.
*/

// 16 vertices alternating outer r=14 / inner r=9.6 around (16,16).
const STAR =
  'M16 2 L19.67 7.13 L25.9 6.1 L24.87 12.33 L30 16 L24.87 19.67 L25.9 25.9 ' +
  'L19.67 24.87 L16 30 L12.33 24.87 L6.1 25.9 L7.13 19.67 L2 16 L7.13 12.33 ' +
  'L6.1 6.1 L12.33 7.13 Z';

export default function SajagMark({
  className = 'h-9 w-9',
  title = 'SAJAG'
}: {
  className?: string;
  /** Pass null when a visible wordmark already names the brand. */
  title?: string | null;
}) {
  // The mark renders more than once per page, so the gradient id must be unique.
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title ?? undefined}
    >
      {title && <title>{title}</title>}

      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="0.55" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0891B2" />
        </linearGradient>
      </defs>

      <path d={STAR} stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinejoin="round" />

      <circle cx="16" cy="16" r="8.6" fill={`url(#${gradientId})`} />

      <text
        x="16"
        y="20.5"
        textAnchor="middle"
        fontFamily="'Noto Sans Devanagari', 'Noto Sans', 'Mangal', system-ui, sans-serif"
        fontSize="11.5"
        fontWeight="700"
        fill="#04141c"
      >
        स
      </text>
    </svg>
  );
}
