import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LottoBall from '../components/LottoBall'
import Icon from '../components/Icon'
import { getAccessibilitySettings, setAccessibilitySettings, getFixedNumbers } from '../utils/storage'

const FONT_SIZES = [
  { value: 'normal', label: '보통' },
  { value: 'large', label: '크게' },
  { value: 'xlarge', label: '아주 크게' },
]

export default function Settings() {
  const navigate = useNavigate()
  const [a11y, setA11y] = useState(getAccessibilitySettings())
  const fixed = getFixedNumbers()

  const updateA11y = (patch) => {
    const next = { ...a11y, ...patch }
    setA11y(next)
    setAccessibilitySettings(next)
    const root = document.documentElement
    if (next.fontSize === 'normal') root.removeAttribute('data-font-size')
    else root.setAttribute('data-font-size', next.fontSize)
    if (next.highContrast) root.setAttribute('data-high-contrast', 'true')
    else root.removeAttribute('data-high-contrast')
  }

  return (
    <div className="page">
      <header className="page-header" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="뒤로">
          <Icon name="back" />
        </button>
        <h1 className="page-title">설정</h1>
      </header>

      <section className="card">
        <h2 className="section-title">글자 크기</h2>
        <p className="section-subtitle">편하게 읽히는 크기를 골라주세요.</p>
        <div className="segmented" style={{ marginBottom: 'var(--space-md)' }} role="group" aria-label="글자 크기">
          {FONT_SIZES.map(f => (
            <button key={f.value} aria-pressed={a11y.fontSize === f.value} onClick={() => updateA11y({ fontSize: f.value })}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="card-inset" style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-2)' }}>
          이번 주 토요일, 좋은 소식이 있기를.
        </div>
      </section>

      <section className="card">
        <div className="setting-row">
          <div>
            <h2 className="section-title">또렷하게 보기</h2>
            <p className="section-subtitle" style={{ margin: 0 }}>흰 바탕에 진한 글씨로 바꿔요.</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={a11y.highContrast}
              onChange={e => updateA11y({ highContrast: e.target.checked })}
              aria-label="또렷하게 보기"
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title"><Icon name="heart" size={20} style={{ color: 'var(--accent)' }} /> 단골 번호</h2>
        <p className="section-subtitle">자동으로 채울 때 꼭 들어가는 번호예요. 최대 3개까지.</p>
        <div className="ball-row" style={{ minHeight: 42, marginBottom: 'var(--space-lg)' }}>
          {fixed.length
            ? fixed.map(n => <LottoBall key={n} number={n} />)
            : <span style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-sm)' }}>아직 정하지 않았어요</span>}
        </div>
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/pick', { state: { fixMode: true } })}>
          번호 고르기에서 {fixed.length ? '바꾸기' : '정하기'}
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">앱 정보</h2>
        <p className="section-subtitle" style={{ marginBottom: 'var(--space-md)' }}>
          동행복권과 무관한 비공식 앱이에요. 복권을 판매하지 않고, 당첨 번호와 판매점 정보만 보여드려요. 복권은 만 19세 이상만 살 수 있어요.
        </p>
        <a className="btn btn-secondary btn-full" href="https://scoremania4.github.io/lotto-day/privacy.html" target="_blank" rel="noopener noreferrer">
          개인정보처리방침 <Icon name="external" size={18} />
        </a>
      </section>

      <p className="footnote">
        로또 당첨되는 날 · 내 번호는 이 기기에만 저장돼요.
      </p>
    </div>
  )
}
