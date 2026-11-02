import React, { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'

// 광고는 홈 맨 아래 한 칸, 높이 50 안팎. 버튼 근처에는 두지 않음
// iOS 앱: AdMob 배너 (.env 의 VITE_ADMOB_BANNER_ID 를 비우면 구글 테스트 광고)
// 웹    : 애드센스 (VITE_ADSENSE_CLIENT / VITE_ADSENSE_SLOT 가 없으면 아무것도 안 그림)
const TEST_BANNER = 'ca-app-pub-3940256099942544/2934735716' // 구글 공식 테스트 ID
const ADMOB_ID = import.meta.env.VITE_ADMOB_BANNER_ID || TEST_BANNER
const IS_TEST = !import.meta.env.VITE_ADMOB_BANNER_ID
const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT
const SLOT = import.meta.env.VITE_ADSENSE_SLOT
const HEIGHT = 50

export default function AdSlot() {
  return Capacitor.isNativePlatform() ? <NativeBanner /> : <WebAd />
}

// 네이티브 배너는 화면 위에 떠 있으므로, 홈 맨 아래 빈칸을 만들어 탭 바 바로 위에 맞춤
function NativeBanner() {
  const spacer = useRef(null)

  useEffect(() => {
    let alive = true
    let AdMob
    ;(async () => {
      try {
        ;({ AdMob } = await import('@capacitor-community/admob'))
        await AdMob.initialize({ initializeForTesting: IS_TEST })
        if (!alive) return
        const tabBar = document.querySelector('.tab-bar')
        await AdMob.showBanner({
          adId: ADMOB_ID,
          adSize: 'BANNER',
          position: 'BOTTOM_CENTER',
          margin: tabBar ? Math.round(tabBar.getBoundingClientRect().height) : 0,
          isTesting: IS_TEST,
        })
      } catch { /* 광고를 못 불러와도 앱은 그대로 */ }
    })()
    return () => { alive = false; AdMob?.removeBanner().catch(() => {}) }
  }, [])

  return <div ref={spacer} className="ad-spacer" aria-hidden="true" />
}

function WebAd() {
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
      <ins className="adsbygoogle" style={{ display: 'block', width: '100%', height: HEIGHT }} data-ad-client={CLIENT} data-ad-slot={SLOT} data-ad-format="horizontal" />
    </aside>
  )
}
