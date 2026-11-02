import React, { useEffect, useRef } from 'react'

// 광고는 이 칸 하나만, 높이 60px 이하. 광고 ID가 없으면 아무것도 그리지 않음
// .env 에 VITE_ADSENSE_CLIENT=ca-pub-... / VITE_ADSENSE_SLOT=... 를 넣으면 켜짐
const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT
const SLOT = import.meta.env.VITE_ADSENSE_SLOT

export default function AdSlot() {
  const pushed = useRef(false)

  useEffect(() => {
    if (!CLIENT || !SLOT || pushed.current) return
    pushed.current = true
    if (!document.querySelector('script[data-adsbygoogle]')) {
      const s = document.createElement('script')
      s.async = true
      s.dataset.adsbygoogle = '1'
      s.crossOrigin = 'anonymous'
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
      document.head.appendChild(s)
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch { /* 광고 차단 등은 무시 */ }
  }, [])

  if (!CLIENT || !SLOT) return null
  return (
    <aside className="ad-slot" aria-label="광고">
      <span className="ad-tag">광고</span>
      <ins className="adsbygoogle" style={{ display: 'block', width: '100%', height: 50 }} data-ad-client={CLIENT} data-ad-slot={SLOT} data-ad-format="horizontal" />
    </aside>
  )
}
