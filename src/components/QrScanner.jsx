import React, { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import Icon from './Icon'

// 카메라로 QR을 읽는 전체 화면. onScan(text)가 true 를 돌려주면 끝, false 면 계속 찍음
// 웹과 iOS 앱(WKWebView) 모두 getUserMedia 로 동작. iOS 는 Info.plist 의 카메라 사용 문구가 필요
export default function QrScanner({ onScan, onClose }) {
  const video = useRef(null)
  const canvas = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream, raf, alive = true, last = 0, lastText = ''

    const tick = (t) => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      const v = video.current
      if (t - last < 120 || !v || v.readyState < 2 || !v.videoWidth) return // 약 8번/초
      last = t
      const w = 480, h = Math.round((v.videoHeight / v.videoWidth) * w)
      const c = canvas.current
      c.width = w; c.height = h
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(v, 0, 0, w, h)
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })
      if (code?.data && code.data !== lastText) {
        lastText = code.data
        if (navigator.vibrate) navigator.vibrate(30)
        if (onScan(code.data)) alive = false
      }
    }

    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (!alive) return stream.getTracks().forEach(tr => tr.stop())
        video.current.srcObject = stream
        await video.current.play()
        raf = requestAnimationFrame(tick)
      } catch (e) {
        setError(e?.name === 'NotAllowedError'
          ? '카메라 사용이 막혀 있어요. 설정에서 카메라를 허용해 주세요.'
          : '카메라를 열 수 없어요. 아래 "링크 붙여넣기"를 이용해 주세요.')
      }
    })()

    return () => { alive = false; cancelAnimationFrame(raf); stream?.getTracks().forEach(tr => tr.stop()) }
  }, [])

  return (
    <div className="scanner" role="dialog" aria-modal="true" aria-label="QR 코드 스캔">
      <video ref={video} playsInline muted className="scanner-video" />
      <canvas ref={canvas} hidden />
      <div className="scanner-shade" />
      <div className="scanner-frame" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="scanner-top">
        <button className="icon-btn" onClick={onClose} aria-label="닫기"><Icon name="close" /></button>
      </div>
      <p className="scanner-hint">{error || '복권 위쪽의 QR 코드를 네모 안에 맞춰주세요'}</p>
    </div>
  )
}
