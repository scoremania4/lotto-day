import React, { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import PatternSheet, { LAYERS, LegendRow } from '../components/PatternSheet'
import LottoBall from '../components/LottoBall'
import Icon from '../components/Icon'
import { PATTERNS, generateRecommendation, generateBubbleMessage, analyzeBalance } from '../algorithms/patterns'
import { ALL_DRAWS, RECENT_RESULTS, getPrevWinningNumbers, calculateFrequency, buildCooccurrenceMatrix } from '../data/lottoHistory'
import { estimateCurrentRound, getNextDrawDate, formatDate, shareNumbers } from '../utils/helpers'
import { saveNumbers, getFixedNumbers, setFixedNumbers, getEnabledPatterns, getWeights } from '../utils/storage'

const MAX_FIXED = 3
const plain = (s) => s.replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/\s+/g, ' ').trim()
const HINT = '마음 가는 번호를 하나씩 눌러보세요. 망설여지면 아래 ‘자동으로 채우기’를 눌러도 좋아요.'

export default function NumberPicker({ showToast }) {
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState(HINT)
  const [multiGames, setMultiGames] = useState([])
  const [showMulti, setShowMulti] = useState(false)
  const [showPatterns, setShowPatterns] = useState(false)
  const navState = useLocation().state
  const [isFixMode, setIsFixMode] = useState(!!navState?.fixMode)
  const [layers, setLayers] = useState(navState?.layers ?? 0)
  const [hidden, setHidden] = useState([])
  const [fixedList, setFixedList] = useState(getFixedNumbers())

  const recentDraws = ALL_DRAWS.slice(-3).reverse() // 0 = 지난주
  const under = recentDraws.slice(0, layers).map((d, i) => hidden.includes(i) ? null : { draw: d, layer: LAYERS[i] })
  const currentRound = estimateCurrentRound()
  const drawDate = getNextDrawDate()
  const prevWinning = useMemo(() => getPrevWinningNumbers(), [])
  const frequencyMap = useMemo(() => calculateFrequency(RECENT_RESULTS), [])
  const cooccurrenceMatrix = useMemo(() => buildCooccurrenceMatrix(ALL_DRAWS), [])
  const enabledPatterns = useMemo(() => getEnabledPatterns(), [])
  const weights = useMemo(() => getWeights(), [])

  const recommend = (base) => generateRecommendation({
    selected: base, enabledPatterns, weights, prevWinning,
    roundNumber: currentRound, drawDate, frequencyMap, cooccurrenceMatrix, count: 6,
  })

  const handleToggleNumber = (num) => {
    if (navigator.vibrate) navigator.vibrate(12)

    if (isFixMode) {
      const has = fixedList.includes(num)
      if (!has && fixedList.length >= MAX_FIXED) {
        showToast(`단골 번호는 ${MAX_FIXED}개까지예요`)
        return
      }
      const next = has ? fixedList.filter(n => n !== num) : [...fixedList, num].sort((a, b) => a - b)
      setFixedList(next)
      setFixedNumbers(next)
      return
    }

    if (selected.includes(num)) {
      const next = selected.filter(n => n !== num)
      setSelected(next)
      setNote(next.length ? `${num}번을 뺐어요.` : HINT)
      return
    }
    if (selected.length >= 6) {
      showToast('여섯 개를 다 골랐어요. 바꾸려면 하나를 눌러 빼주세요')
      return
    }
    const next = [...selected, num].sort((a, b) => a - b)
    setSelected(next)
    setNote(plain(generateBubbleMessage(num, next, prevWinning, cooccurrenceMatrix)))
  }

  const handleAuto = () => {
    if (selected.length === 6) {
      showToast('이미 여섯 개를 모두 골랐어요')
      return
    }
    const merged = [...new Set([...fixedList, ...selected])]
    const base = merged.length <= 6 ? merged : selected
    setSelected(recommend(base))
    if (selected.length) setNote(`고르신 ${selected.length}개와 어울리는 번호로 나머지를 채웠어요.`)
    else if (fixedList.length) setNote(`단골 번호 ${fixedList.join(', ')}번을 넣고 나머지를 채웠어요.`)
    else setNote('한 줄 골라봤어요. 마음에 안 드는 번호는 눌러서 바꿔보세요.')
  }

  const handleFive = () => {
    setMultiGames(Array.from({ length: 5 }, () => recommend([...fixedList])))
    setShowMulti(true)
  }

  const handleSave = () => {
    saveNumbers(currentRound, selected, false)
    showToast(`제 ${currentRound}회 번호를 보관함에 담았어요`)
  }

  const handleSaveAllMulti = () => {
    multiGames.forEach(g => saveNumbers(currentRound, g, false))
    setShowMulti(false)
    showToast('다섯 줄 모두 보관함에 담았어요')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`제 ${currentRound}회 내 번호: ${selected.join(', ')}`)
      .then(() => showToast('번호를 복사했어요'))
      .catch(() => showToast('복사하지 못했어요'))
  }

  const handleShare = async () => {
    const result = await shareNumbers(selected, currentRound)
    if (result === 'copied') showToast('번호를 복사했어요. 원하는 곳에 붙여넣어 주세요')
    else if (!result) showToast('공유하지 못했어요')
  }

  const balance = selected.length === 6 ? analyzeBalance(selected) : null

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">제 {currentRound}회 · {formatDate(drawDate)}</div>
          <h1 className="page-title">번호 고르기</h1>
        </div>
        <button
          className={`chip ${isFixMode ? 'chip-accent' : ''}`}
          style={{ marginTop: 6 }}
          onClick={() => setIsFixMode(!isFixMode)}
          aria-pressed={isFixMode}
        >
          <Icon name="heart" size={16} /> {isFixMode ? '단골 번호 고르는 중' : '단골 번호'}
        </button>
      </header>

      {isFixMode ? (
        <div className="speech-bubble" style={{ background: 'var(--accent-soft)', color: 'var(--accent-press)' }}>
          <Icon name="heart" size={20} style={{ color: 'var(--accent)' }} />
          <div style={{ flex: 1 }}>
            늘 넣고 싶은 번호를 눌러주세요. 자동으로 채울 때 꼭 들어가요. ({fixedList.length}/{MAX_FIXED})
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xs)' }}>
              <button className="text-link" style={{ color: 'inherit', padding: 0 }} onClick={() => setIsFixMode(false)}>다 골랐어요</button>
              {fixedList.length > 0 && (
                <button className="text-link" style={{ color: 'inherit', padding: 0 }} onClick={() => { setFixedList([]); setFixedNumbers([]) }}>모두 비우기</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="speech-bubble" key={note}>
          <Icon name="sparkle" size={20} />
          <span>{note}</span>
        </div>
      )}

      {/* 고른 번호 */}
      <section className="card" style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontWeight: 700 }}>고른 번호 <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>{selected.length}/6</span></span>
          {selected.length > 0 && (
            <button className="chip" onClick={() => { setSelected([]); setNote(HINT) }}>
              <Icon name="eraser" size={15} /> 지우기
            </button>
          )}
        </div>

        <div className="ball-row spread">
          {Array.from({ length: 6 }, (_, i) => selected[i]
            ? (
              <button key={i} onClick={() => handleToggleNumber(selected[i])} aria-label={`${selected[i]}번 빼기`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <LottoBall number={selected[i]} />
              </button>
            )
            : <span key={i} className="ball-slot">{i + 1}</span>
          )}
        </div>

        {balance && (
          <>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'var(--space-lg)' }}>
              <span className="chip">홀짝 {balance.oddEven[0]}:{balance.oddEven[1]}</span>
              <span className="chip">작은·큰 수 {balance.highLow[0]}:{balance.highLow[1]}</span>
              <span className="chip">합계 {balance.sum}</span>
            </div>
            <p style={{ fontSize: 'var(--fs-xs)', color: balance.balanced ? 'var(--leaf)' : 'var(--gold)', marginTop: 'var(--space-sm)' }}>
              {balance.balanced ? '골고루 잘 섞였어요.' : `${balance.warnings[0]}.`}
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                <Icon name="bookmark" size={20} /> 보관함에 담기
              </button>
              <button className="btn btn-secondary" style={{ width: 52, padding: 0 }} onClick={handleCopy} aria-label="번호 복사">
                <Icon name="copy" size={20} />
              </button>
              <button className="btn btn-secondary" style={{ width: 52, padding: 0 }} onClick={handleShare} aria-label="공유하기">
                <Icon name="share" size={20} />
              </button>
            </div>
          </>
        )}
      </section>

      {/* 마킹 용지 = 패턴표 */}
      <section className="card" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
        <div className="setting-row" style={{ marginBottom: 'var(--space-sm)' }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>지난 회차 겹쳐보기</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> 단골 번호
          </span>
        </div>
        <div className="segmented" role="group" aria-label="겹쳐 볼 회차 수" style={{ marginBottom: 0 }}>
          {[0, 1, 2, 3].map(n => (
            <button key={n} aria-pressed={layers === n} onClick={() => setLayers(n)}>{n ? `${n}회 전까지` : '끄기'}</button>
          ))}
        </div>

        <PatternSheet
          under={under.filter(Boolean)}
          marks={isFixMode ? [] : selected}
          fixed={fixedList}
          onMark={handleToggleNumber}
        />

        {layers > 0 && (
          <div style={{ display: 'grid', gap: 4, marginTop: 'var(--space-sm)' }}>
            {recentDraws.slice(0, layers).map((d, i) => (
              <LegendRow
                key={i}
                color={LAYERS[i].color}
                label={LAYERS[i].label}
                sub={`${d.round}회`}
                draw={d}
                off={hidden.includes(i)}
                onToggle={() => setHidden(h => h.includes(i) ? h.filter(x => x !== i) : [...h, i])}
              />
            ))}
          </div>
        )}
      </section>

      {/* 추천 */}
      <div style={{ display: 'grid', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
        <button className="btn btn-primary btn-lg" onClick={handleAuto} disabled={isFixMode}>
          <Icon name="sparkle" /> {selected.length ? '남은 칸 자동으로 채우기' : '자동으로 채우기'}
        </button>
        <button className="btn btn-secondary" onClick={handleFive} disabled={isFixMode}>
          <Icon name="stack" size={20} /> 다섯 줄 한 번에 받기
        </button>
        <button className="text-link" style={{ justifySelf: 'center' }} onClick={() => setShowPatterns(true)}>
          자동 번호는 이렇게 골라요
        </button>
      </div>

      {showMulti && (
        <Sheet title="다섯 줄 추천" onClose={() => setShowMulti(false)}>
          <p className="section-subtitle">마음에 드는 줄은 ‘고치기’로 가져가서 바꿀 수 있어요.</p>
          <div style={{ display: 'grid', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
            {multiGames.map((game, idx) => {
              const label = String.fromCharCode(65 + idx)
              return (
                <div key={idx} className="card-inset" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', width: 16 }}>{label}</span>
                  <div className="ball-row nowrap" style={{ flex: 1, gap: 4 }}>
                    {game.map(n => <LottoBall key={n} number={n} size="sm" />)}
                  </div>
                  <button
                    className="chip"
                    onClick={() => {
                      setSelected(game)
                      setShowMulti(false)
                      setNote(`${label}줄을 가져왔어요. 바꾸고 싶은 번호를 눌러보세요.`)
                    }}
                  >
                    고치기
                  </button>
                </div>
              )
            })}
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={handleSaveAllMulti}>
            <Icon name="bookmark" /> 다섯 줄 모두 담기
          </button>
        </Sheet>
      )}

      {showPatterns && (
        <Sheet title="자동 번호는 이렇게 골라요" onClose={() => setShowPatterns(false)}>
          <p className="section-subtitle">
            지난 회차 번호와 용지 모양에서 찾은 {PATTERNS.length}가지 습관을 섞어서 골라요.
            재미를 위한 방법이고, 당첨 확률을 높여주지는 않아요.
          </p>
          <div>
            {PATTERNS.map((p, i) => {
              const off = enabledPatterns[p.id] === false
              return (
                <div key={p.id} className="pattern-card" style={{ opacity: off ? 0.45 : 1 }}>
                  <span className="pattern-index">{i + 1}</span>
                  <div className="pattern-info">
                    <div className="pattern-name">{p.name}</div>
                    <div className="pattern-desc">{p.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Sheet>
      )}
    </div>
  )
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn bare" onClick={onClose} aria-label="닫기"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
