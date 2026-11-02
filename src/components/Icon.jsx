import React from 'react'

// 둥근 끝 선 아이콘 세트 (24 그리드, currentColor)
const PATHS = {
  home: <><path d="M4 10.6 12 4l8 6.6V19a1 1 0 0 1-1 1h-4.6v-5.2a2.4 2.4 0 0 0-4.8 0V20H5a1 1 0 0 1-1-1z" /></>,
  clover: <g transform="translate(0 -.8)">
    {[0, 90, 180, 270].map(r => (
      <path key={r} transform={`rotate(${r} 12 12)`} d="M12 11.2C10.2 10 8.9 8.8 8.9 7.3a1.75 1.75 0 0 1 3.1-1.1 1.75 1.75 0 0 1 3.1 1.1c0 1.5-1.3 2.7-3.1 3.9z" />
    ))}
    <path d="M12.6 12.6c1.4 1.6 2.6 3.8 3.2 7" />
  </g>,
  ticket: <>
    <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2.2a2.3 2.3 0 0 0 0 4.6v2.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2.2a2.3 2.3 0 0 0 0-4.6z" />
    <path d="M14.5 6.5v11" strokeDasharray="1.6 2.2" />
  </>,
  pin: <><path d="M12 20.5s-6.2-5.3-6.2-10.6a6.2 6.2 0 0 1 12.4 0c0 5.3-6.2 10.6-6.2 10.6z" /><circle cx="12" cy="9.9" r="2.2" /></>,
  sliders: <><path d="M4 7.5h9.5M18.5 7.5H20M4 16.5h3.5M12.5 16.5H20" /><circle cx="16" cy="7.5" r="2.3" /><circle cx="10" cy="16.5" r="2.3" /></>,
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  moon: <><path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1z" /><path d="M17 3.8v2.4M15.8 5h2.4" /></>,
  sparkle: <><path d="M11 4.5c.5 3.2 1.8 4.5 5 5-3.2.5-4.5 1.8-5 5-.5-3.2-1.8-4.5-5-5 3.2-.5 4.5-1.8 5-5z" /><path d="M18 14.5c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2z" /></>,
  stack: <><rect x="4" y="9" width="16" height="10" rx="2" /><path d="M6.5 6.2h11M9 3.6h6" /></>,
  bookmark: <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.8L6 20V5.5a1 1 0 0 1 1-1z" />,
  share: <><path d="M12 14.5V4.5M8 8.2l4-3.7 4 3.7" /><path d="M5.5 12.5v5.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-5.5" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2.2" /><path d="M15.5 8.5V6.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h1.8" /></>,
  heart: <path d="M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z" />,
  eraser: <><path d="M5.8 15.6 13.6 7.8a2 2 0 0 1 2.8 0l1.8 1.8a2 2 0 0 1 0 2.8L12 18.6H8.8z" /><path d="M9.5 11.9l4.6 4.6M12 18.6h7" /></>,
  pencil: <><path d="M5 19l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L9 18z" /><path d="M13.8 7.2l3 3" /></>,
  qr: <><rect x="4.5" y="4.5" width="5.5" height="5.5" rx="1.2" /><rect x="14" y="4.5" width="5.5" height="5.5" rx="1.2" /><rect x="4.5" y="14" width="5.5" height="5.5" rx="1.2" /><path d="M14 14h2.2v2.2M19.5 14v.01M14 19.5h.01M17.2 17.2h2.3v2.3" /></>,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  check: <path d="M5.5 12.5l4 4 9-9.5" />,
  trash: <><path d="M5 7.5h14M10 4.5h4M7 7.5l.8 11a1.6 1.6 0 0 0 1.6 1.5h5.2a1.6 1.6 0 0 0 1.6-1.5l.8-11" /></>,
  flame: <path d="M12 20.5c-3.3 0-5.8-2.3-5.8-5.4 0-3.4 2.8-5 3.4-8.9 2.4 1.5 4 3.8 4.2 5.8.8-.7 1.2-1.9 1.2-2.9 1.7 1.5 2.8 3.9 2.8 6 0 3.1-2.5 5.4-5.8 5.4z" />,
  snow: <><path d="M12 3.5v17M4.6 7.8l14.8 8.4M4.6 16.2l14.8-8.4" /><path d="M10 5l2 1.8L14 5M10 19l2-1.8 2 1.8" /></>,
  map: <><path d="M9 5.2 4.5 6.8v12l4.5-1.6 6 2 4.5-1.6v-12L15 7.2z" /><path d="M9 5.2v12M15 7.2v12" /></>,
  locate: <><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><path d="M12 2.8v2.7M12 18.5v2.7M2.8 12h2.7M18.5 12h2.7" /></>,
  external: <><path d="M13.5 4.5h6v6M19.5 4.5l-8 8" /><path d="M17.5 13.5v4.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 6 6.5h4.5" /></>,
  info: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8v.01" /></>,
  chevron: <path d="M9.5 6l6 6-6 6" />,
  chart: <><path d="M4.5 17.5l5-8 4 5 5.5-9" /><circle cx="4.5" cy="17.5" r="1.4" /><circle cx="9.5" cy="9.5" r="1.4" /><circle cx="13.5" cy="14.5" r="1.4" /><circle cx="19" cy="5.5" r="1.4" /></>,
  carry: <><path d="M7 19V8.5a3.5 3.5 0 0 1 7 0V19" /><path d="M11 16l3 3 3-3" /><circle cx="7" cy="19" r="1.4" /></>,
  envelope: <><rect x="4" y="6" width="16" height="12.5" rx="2" /><path d="M4.5 7l7.5 6 7.5-6" /></>,
}

export default function Icon({ name, size = 22, strokeWidth = 1.8, style, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}
