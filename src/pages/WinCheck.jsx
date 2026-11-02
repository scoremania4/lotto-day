import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LottoBall from '../components/LottoBall'
import Confetti from '../components/Confetti'
import Icon from '../components/Icon'
import { ALL_DRAWS, findDraw, getLatestResult } from '../data/lottoHistory'
import { formatMoney, formatDate } from '../utils/helpers'
import QrScanner from '../components/QrScanner'
import { parseQR } from '../utils/qr'
import { getNumberHistory, togglePurchased, deleteHistoryItem, saveNumbers } from '../utils/storage'

const findRound = findDraw

function rankOf(numbers, draw) {
  const hit = numbers.filter(n => draw.numbers.includes(n)).length
  const bonus = numbers.includes(draw.bonus)
  const rank = hit === 6 ? 1 : hit === 5 && bonus ? 2 : hit === 5 ? 3 : hit === 4 ? 4 : hit === 3 ? 5 : 0
  if (!rank) return { rank, label: hit ? `${hit}개 맞았어요` : '다음 기회에' }
  return { rank, label: `${rank}등`, prize: draw.prizes[rank - 1] }
}

export default function WinCheck({ showToast }) {
  const navigate = useNavigate()
  const latest = getLatestResult()
  const [selectedRound, setSelectedRound] = useState(latest.round)
  const [tab, setTab] = useState('saved')
  const [history, setHistory] = useState(getNumberHistory())
  const [qrText, setQrText] = useState('')
  const [qrResult, setQrResult] = useState(null)
  const [scanning, setScanning] = useState(false)

  const draw = findRound(selectedRound) || latest
  const refresh = () => setHistory(getNumberHistory())

  const bigWin = useMemo(() => history.some(item => {
    const d = findRound(item.roundNumber)
    return d && rankOf(item.numbers, d).rank >= 1 && rankOf(item.numbers, d).rank <= 3
  }), [history])

  const [showConfetti, setShowConfetti] = useState(false)
  useEffect(() => { if (bigWin) setShowConfetti(true) }, [bigWin])

  const handleQR = (raw = qrText, strict = false) => {
    const text = raw.trim()
    if (!text) return showToast('QR 링크나 번호를 붙여넣어 주세요')
    const res = parseQR(text, selectedRound, strict)
    if (!res.games.length) { showToast('로또 용지 QR이 아니에요. 다시 찍어주세요'); return false }
    if (findRound(res.round)) setSelectedRound(res.round)
    setQrResult(res)
    return true
  }


  return (
    <div className="page">
      <Confetti show={showConfetti} />

      <header className="page-header">
        <div>
          <div className="eyebrow">두근두근, 맞춰볼까요</div>
          <h1 className="page-title">당첨 확인</h1>
        </div>
      </header>

      {/* 회차 당첨 번호 */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <span className="section-title" style={{ margin: 0 }}>당첨 번호</span>
          <select className="select" value={selectedRound} onChange={e => setSelectedRound(Number(e.target.value))} aria-label="회차 선택">
            {ALL_DRAWS.slice(-52).reverse().map(r => <option key={r.round} value={r.round}>제 {r.round}회</option>)}
          </select>
        </div>
        <div className="ball-row center nowrap">
          {draw.numbers.map(n => <LottoBall key={n} number={n} size="lg" />)}
          <span className="ball-divider">+</span>
          <LottoBall number={draw.bonus} size="lg" bonus />
        </div>
        <div className="card-inset" style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
          <span style={{ color: 'var(--ink-3)' }}>{formatDate(draw.date)} · 1등 {draw.winners1}명</span>
          <strong style={{ color: 'var(--gold)' }}>{formatMoney(draw.prize1)}</strong>
        </div>
      </section>

      <div className="segmented" style={{ marginTop: 'var(--space-xl)' }} role="group" aria-label="확인 방법">
        <button aria-pressed={tab === 'saved'} onClick={() => setTab('saved')}><Icon name="bookmark" size={17} /> 보관함</button>
        <button aria-pressed={tab === 'qr'} onClick={() => setTab('qr')}><Icon name="qr" size={17} /> QR 링크</button>
      </div>

      {/* 보관함 */}
      {tab === 'saved' && (history.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon"><Icon name="envelope" size={48} strokeWidth={1.4} /></div>
          <div className="empty-text">아직 담아둔 번호가 없어요</div>
          <p className="section-subtitle" style={{ margin: 'var(--space-sm) 0 var(--space-lg)' }}>
            번호를 고르거나 산 용지의 QR을 넣어두면<br />추첨 뒤에 여기서 바로 맞춰볼 수 있어요.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/pick')}>
            <Icon name="clover" size={20} /> 번호 고르러 가기
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {history.map(item => {
            const d = findRound(item.roundNumber)
            const res = d && rankOf(item.numbers, d)
            const win = res && res.rank > 0
            return (
              <article key={item.id} className={`history-item${win ? ' win' : ''}`}>
                <div className="history-header">
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px var(--space-sm)', minWidth: 0 }}>
                    <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>제 {item.roundNumber}회</span>
                    {!d && <span className="chip">추첨 전</span>}
                    {res && <span className={`chip ${win ? 'chip-accent' : ''}`}>{res.label}{res.prize ? ` · ${formatMoney(res.prize)}` : ''}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      className={`chip ${item.isPurchased ? 'chip-leaf' : ''}`}
                      onClick={() => { togglePurchased(item.id); refresh() }}
                      aria-pressed={item.isPurchased}
                    >
                      {item.isPurchased && <Icon name="check" size={14} strokeWidth={2.4} />}
                      {item.isPurchased ? '샀어요' : '안 샀어요'}
                    </button>
                    <button
                      className="icon-btn bare"
                      onClick={() => {
                        if (!window.confirm('이 번호를 보관함에서 지울까요?')) return
                        deleteHistoryItem(item.id)
                        refresh()
                        showToast('지웠어요')
                      }}
                      aria-label="지우기"
                    >
                      <Icon name="trash" size={19} />
                    </button>
                  </div>
                </div>
                <div className="ball-row spread">
                  {item.numbers.map(n => {
                    const hit = d?.numbers.includes(n)
                    const bonusHit = d && n === d.bonus
                    return (
                      <span key={n} className="hit-wrap">
                        <LottoBall number={n} dim={d && !hit && !bonusHit} bonus={bonusHit} />
                        {hit && <span className="hit-mark"><Icon name="check" size={10} strokeWidth={3.2} /></span>}
                      </span>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      ))}

      {/* QR 링크 */}
      {tab === 'qr' && (
        <section className="card">
          <h2 className="section-title">용지의 QR로 확인하기</h2>
          <p className="section-subtitle">복권 위쪽의 QR 코드를 카메라로 비추면 번호를 바로 읽어와요.</p>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => setScanning(true)}>
            <Icon name="qr" size={22} /> 카메라로 QR 찍기
          </button>

          <details className="manual-qr">
            <summary>카메라가 안 되면 링크를 붙여넣기</summary>
            <input
              className="input"
              type="url"
              inputMode="url"
              placeholder="m.dhlottery.co.kr/?v=…"
              value={qrText}
              onChange={e => setQrText(e.target.value)}
            />
            <button className="btn btn-secondary btn-full" style={{ marginTop: 'var(--space-sm)' }} onClick={() => handleQR()}>
              확인하기
            </button>
          </details>

          {scanning && (
            <QrScanner
              onClose={() => setScanning(false)}
              onScan={(text) => {
                if (handleQR(text, true) === false) return false // 용지 QR이 아니면 계속 찍게 둠
                setScanning(false)
                return true
              }}
            />
          )}

          {qrResult && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-sm)' }}>제 {qrResult.round}회 · {qrResult.games.length}줄</div>
              <div style={{ display: 'grid', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                {qrResult.games.map((game, idx) => {
                  const d = findRound(qrResult.round)
                  const res = d && rankOf(game, d)
                  return (
                    <div key={idx} className="card-inset">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', fontSize: 'var(--fs-sm)' }}>
                        <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{String.fromCharCode(65 + idx)}</strong>
                        <span style={{ fontWeight: 700, color: res?.rank ? 'var(--accent)' : 'var(--ink-3)' }}>{res ? res.label : '추첨 전'}</span>
                      </div>
                      <div className="ball-row spread">
                        {game.map(n => <LottoBall key={n} number={n} size="sm" />)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => {
                  const added = qrResult.games.filter(g => !saveNumbers(qrResult.round, g, true).duplicate).length
                  const skipped = qrResult.games.length - added
                  refresh()
                  setTab('saved')
                  showToast(added
                    ? `${added}줄을 산 번호로 담았어요${skipped ? ` (이미 있는 ${skipped}줄은 건너뛰었어요)` : ''}`
                    : '이미 보관함에 있는 번호예요')
                }}
              >
                <Icon name="bookmark" size={19} /> {qrResult.games.length}줄 모두 보관함에 담기
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
