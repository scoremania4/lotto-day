import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LottoBall from '../components/LottoBall'
import Icon from '../components/Icon'
import AdSlot from '../components/AdSlot'
import { getLatestResult, RECENT_RESULTS, calculateFrequency } from '../data/lottoHistory'
import { estimateCurrentRound, getNextDrawDate, formatDate, formatMoney, getTimeUntilDraw } from '../utils/helpers'
import { getStreak, getNumberHistory } from '../utils/storage'

function greeting(t) {
  if (t.expired) return '추첨이 막 끝났어요. 결과를 확인해 볼까요?'
  if (t.days === 0) return '오늘 밤이에요. 두근두근, 행운을 빌어요.'
  if (t.days === 1) return '내일이 토요일이에요. 마음에 둔 번호 있으세요?'
  if (t.days <= 3) return '조금만 기다리면 토요일이에요.'
  return '새로운 한 주예요. 천천히 번호를 골라보세요.'
}

export default function Home() {
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDraw())
  const latest = getLatestResult()
  const currentRound = estimateCurrentRound()
  const nextDraw = getNextDrawDate()
  const streak = getStreak()
  const history = getNumberHistory()

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeUntilDraw()), 30000)
    return () => clearInterval(timer)
  }, [])

  const freq = calculateFrequency(RECENT_RESULTS)
  const byFreq = Object.entries(freq).map(([n, c]) => [Number(n), c])
  const hot = [...byFreq].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n).sort((a, b) => a - b)
  const cold = [...byFreq].sort((a, b) => a[1] - b[1]).slice(0, 4).map(([n]) => n).sort((a, b) => a - b)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">토요일 저녁의 작은 설렘</div>
          <h1 className="page-title brand">
            <span className="brand-mark"><Icon name="clover" size={26} strokeWidth={2} /></span>
            로또 당첨되는 날
          </h1>
        </div>
        <button className="icon-btn" onClick={() => navigate('/settings')} aria-label="설정">
          <Icon name="sliders" />
        </button>
      </header>

      {streak.count >= 2 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <span className="chip chip-leaf"><Icon name="clover" size={16} /> {streak.count}일째 찾아주셨네요</span>
        </div>
      )}

      {/* 이번 주 추첨 - 티켓 */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--ink-3)' }}>
          <Icon name="moon" size={20} />
          <span className="eyebrow">제 {currentRound}회 · {formatDate(nextDraw)} 저녁 8시 35분</span>
        </div>

        <div style={{ margin: 'var(--space-lg) 0 var(--space-sm)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
          {timeLeft.expired ? (
            <span style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700 }}>추첨 중이에요</span>
          ) : (
            <>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', fontFamily: 'var(--font-body)' }}>추첨까지</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-md)', marginTop: 4 }}>
                {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} unit="일" />}
                <TimeUnit value={timeLeft.hours} unit="시간" />
                <TimeUnit value={timeLeft.minutes} unit="분" />
              </div>
            </>
          )}
        </div>
        <p style={{ color: 'var(--ink-2)', fontSize: 'var(--fs-sm)' }}>{greeting(timeLeft)}</p>

        <div className="ticket-tear" />

        <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/pick')}>
          <Icon name="clover" /> 이번 주 번호 고르기
        </button>
      </section>

      {/* 지난 회차 */}
      <section className="card">
        <div className="eyebrow">제 {latest.round}회 · {formatDate(latest.date)}</div>
        <h2 className="section-title" style={{ marginBottom: 'var(--space-lg)' }}>지난주 당첨 번호</h2>
        <div className="ball-row center nowrap">
          {latest.numbers.map(n => <LottoBall key={n} number={n} size="lg" />)}
          <span className="ball-divider">+</span>
          <LottoBall number={latest.bonus} size="lg" bonus />
        </div>
        <div className="card-inset" style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
          <span style={{ color: 'var(--ink-3)' }}>1등 {latest.winners1}명 · 한 분당</span>
          <strong style={{ color: 'var(--gold)' }}>{formatMoney(latest.prize1)}</strong>
        </div>
        <button className="text-link" style={{ marginTop: 'var(--space-sm)' }} onClick={() => navigate('/check')}>
          내 번호랑 맞춰보기
        </button>
      </section>

      {/* 번호 이야기 */}
      <section className="card">
        <h2 className="section-title">최근 15회의 번호 이야기</h2>
        <p className="section-subtitle">자주 얼굴을 비춘 번호와, 한동안 쉬고 있는 번호예요.</p>
        <NumberRow icon="flame" color="var(--accent)" label="자주 나온 번호" numbers={hot} />
        <div style={{ height: 'var(--space-md)' }} />
        <NumberRow icon="snow" color="var(--sky)" label="쉬고 있는 번호" numbers={cold} />
      </section>

      {/* 내 번호 */}
      {history.length > 0 && (
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="section-title">내가 고른 번호</h2>
            <span className="eyebrow">모두 {history.length}장</span>
          </div>
          <div className="card-inset" style={{ marginTop: 'var(--space-md)' }}>
            <div className="eyebrow" style={{ marginBottom: 'var(--space-sm)' }}>가장 최근 · 제 {history[0].roundNumber}회</div>
            <div className="ball-row spread">
              {history[0].numbers.map(n => <LottoBall key={n} number={n} />)}
            </div>
          </div>
          <button className="btn btn-secondary btn-full" style={{ marginTop: 'var(--space-md)' }} onClick={() => navigate('/check')}>
            보관함 열어보기
          </button>
        </section>
      )}

      <p className="footnote">
        로또는 매 회 새로 추첨돼요.<br />
        추천 번호는 재미로, 구매는 적당히 즐겨주세요.
      </p>

      <AdSlot />
    </div>
  )
}

function TimeUnit({ value, unit }) {
  return (
    <span>
      <span style={{ fontSize: 'var(--fs-3xl)', fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
      <span style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-2)', marginLeft: 2 }}>{unit}</span>
    </span>
  )
}

function NumberRow({ icon, color, label, numbers }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--ink-2)' }}>
        <Icon name={icon} size={18} style={{ color }} /> {label}
      </span>
      <div className="ball-row nowrap">
        {numbers.map(n => <LottoBall key={n} number={n} size="sm" />)}
      </div>
    </div>
  )
}
