/* Marque : un livre ouvert traversé d'un croissant (trace originale). */

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="DiwaneKiram"
    >
      <defs>
        <linearGradient id="dk-mark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--cyan)" />
          <stop offset="60%" stopColor="var(--mint)" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="13"
        stroke="url(#dk-mark)"
        strokeWidth="1.4"
        opacity="0.55"
      />
      <path
        d="M24 12.5c-3.1-2-6.6-2.9-10.5-2.7-.9 0-1.6.8-1.6 1.7v16.4c0 1 .8 1.8 1.8 1.7 3.5-.3 7 .6 10.3 2.6 3.3-2 6.8-2.9 10.3-2.6 1 0 1.8-.7 1.8-1.7V11.5c0-.9-.7-1.7-1.6-1.7-3.9-.2-7.4.7-10.5 2.7Z"
        stroke="url(#dk-mark)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M24 12.5v19.7" stroke="url(#dk-mark)" strokeWidth="1.4" />
      <path
        d="M31.4 17.2a5.4 5.4 0 1 0 0 7.4 6 6 0 0 1 0-7.4Z"
        fill="url(#dk-mark)"
        opacity="0.9"
      />
    </svg>
  )
}
