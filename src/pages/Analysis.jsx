import React, { useState, useMemo } from 'react'
import LottoBall from '../components/LottoBall'
import Icon from '../components/Icon'
import { ALL_DRAWS, findDraw } from '../data/lottoHistory'
import { analyzeDraw, zoneCounts, carriedFrom, carryStreak, carrySummary } from '../algorithms/formulas'
import { formatDate } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import PatternSheet, { LAYERS, LegendRow } from '../components/PatternSheet'

const ZONE_COLORS = ['var(--ball-1)', 'var(--ball-2)', 'var(--ball-3)', 'var(--ball-4)', 'var(--ball-5)']

export default function Analysis() {
  const [view, setView] = useState('pattern')
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">1회부터 {ALL_DRAWS.length}회까지</div>
          <h1 className="page-title">패턴 분석</h1>
        </div>
      </header>
      <div className="segmented" role="group" aria-label="분석 보기">
        <button aria-pressed={view === 'pattern'} onClick={() => setView('pattern')}><Icon name="chart" size={17} /> 패턴표</button>
        <button aria-pressed={view === 'carry'} onClick={() => setView('carry')}><Icon name="carry" size={17} /> 이월수</button>
      </div>
      {view === 'pattern' ? <PatternView /> : <CarryView />}
    </div>
  )
}

/* ── 패턴표 + 로또 공식 ── */
function PatternView() {
  const [round, setRound] = useState(ALL_DRAWS.length)
  const [layers, setLayers] = useState(3)
  const [hidden, setHidden] = useState([]) // 범례에서 끈 밑그림 (0=1회 전)
  const [showBonus, setShowBonus] = useState(true)
  const navigate = useNavigate()
  const draw = findDraw(round)
  const under = Array.from({ length: layers }, (_, i) => findDraw(round - 1 - i))
    .map((d, i) => d && !hidden.includes(i) ? { draw: d, layer: LAYERS[i] } : null)
  const toggleLayer = (i) => setHidden(h => h.includes(i) ? h.filter(x => x !== i) : [...h, i])
  const formulas = useMemo(() => analyzeDraw(draw), [draw])
  const zones = zoneCounts(draw.numbers)
  const go = (r) => setRound(Math.min(ALL_DRAWS.length, Math.max(1, r)))

  return (
    <>
      <section className="card" style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <button className="icon-btn" onClick={() => go(round - 1)} disabled={round <= 1} aria-label="이전 회차"><Icon name="back" /></button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700 }}>제 {round}회</div>
            <div className="eyebrow">{formatDate(draw.date)}</div>
          </div>
          <button className="icon-btn" onClick={() => go(round + 1)} disabled={round >= ALL_DRAWS.length} aria-label="다음 회차"><Icon name="chevron" /></button>
        </div>
        <input
          className="range"
          type="range"
          min={1}
          max={ALL_DRAWS.length}
          value={round}
          onChange={e => setRound(Number(e.target.value))}
          aria-label="회차 이동"
        />

        <div className="setting-row" style={{ margin: 'var(--space-lg) 0 var(--space-sm)' }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>밑그림 겹쳐보기</span>
          <button className={`chip ${showBonus ? 'chip-accent' : ''}`} onClick={() => setShowBonus(!showBonus)} aria-pressed={showBonus}>보너스 표시</button>
        </div>
        <div className="segmented" role="group" aria-label="겹쳐 볼 회차 수">
          {[0, 1, 2, 3].map(n => (
            <button key={n} aria-pressed={layers === n} onClick={() => setLayers(n)}>{n ? `${n}회 전까지` : '끄기'}</button>
          ))}
        </div>

        <PatternSheet draw={draw} under={under.filter(Boolean)} showBonus={showBonus} />

        <div style={{ display: 'grid', gap: 4, marginTop: 'var(--space-md)' }}>
          <LegendRow color="var(--ink)" label="이번 회차" sub={`${round}회`} draw={draw} strong />
          {Array.from({ length: layers }, (_, i) => {
            const d = findDraw(round - 1 - i)
            if (!d) return null
            return (
              <LegendRow
                key={i}
                color={LAYERS[i].color}
                label={LAYERS[i].label}
                sub={`${d.round}회`}
                draw={d}
                off={hidden.includes(i)}
                onToggle={() => toggleLayer(i)}
              />
            )
          })}
        </div>

        <button
          className="btn btn-secondary btn-full"
          style={{ marginTop: 'var(--space-md)' }}
          onClick={() => navigate('/pick', { state: { layers: Math.max(layers, 1) } })}
        >
          <Icon name="pencil" size={19} /> 지난 패턴 겹쳐 놓고 번호 고르기
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">로또 공식</h2>
        <p className="section-subtitle">제 {round}회 번호를 공식으로 풀어보고, 1회부터 같은 값이 나온 비율과 견줘봤어요.</p>
        <div>
          {formulas.map(f => (
            <div key={f.id} className="formula-row">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{f.label}</div>
                <div className="pattern-desc">{f.desc}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="formula-value">{f.value}</div>
                <span className={`chip ${f.isMode ? 'chip-leaf' : ''}`} style={{ padding: '2px 8px' }}>
                  {f.bucket ? `${f.bucket} ` : ''}역대 {f.pct}%{f.isMode ? ' · 최다' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>번호대 분포</div>
          <div className="zone-bars">
            {zones.map((c, i) => (
              <div key={i} className="zone-col">
                <div className="zone-track"><div className="zone-fill" style={{ height: `${(c / 6) * 100}%`, background: ZONE_COLORS[i] }} /></div>
                <strong>{c}</strong>
                <span>{i === 4 ? '41~45' : `${i * 10 + 1}~${i * 10 + 10}`}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

/* ── 이월수 ── */
const PAGE = 20

function CarryView() {
  const [withBonus, setWithBonus] = useState(true)
  const [shown, setShown] = useState(PAGE)
  const summary = useMemo(() => carrySummary(withBonus), [withBonus])
  const rows = useMemo(() => ALL_DRAWS.slice(-shown).reverse(), [shown])
  const labels = ['없음', '1개', '2개', '3개 이상']

  return (
    <>
      <div className="setting-row" style={{ marginBottom: 'var(--space-md)' }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>지난 회차 번호가 다시 나온 것</span>
        <label className="setting-row" style={{ gap: 'var(--space-sm)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
          보너스 포함
          <span className="toggle-switch">
            <input type="checkbox" checked={withBonus} onChange={e => setWithBonus(e.target.checked)} />
            <span className="toggle-slider" />
          </span>
        </label>
      </div>

      <section className="card">
        <h2 className="section-title">한눈에 보는 이월</h2>
        <p className="section-subtitle">2회부터 {ALL_DRAWS.length}회까지 {summary.rounds}번의 추첨을 모았어요. 평균 {summary.avg.toFixed(2)}개가 넘어와요.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {summary.dist.map((c, i) => {
            const pct = (c / summary.rounds) * 100
            return (
              <div key={i} className="dist-row">
                <span>{labels[i]}</span>
                <div className="dist-track"><div className="dist-fill" style={{ width: `${pct}%`, opacity: 0.45 + i * 0.18 }} /></div>
                <strong>{pct.toFixed(1)}%</strong>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 'var(--space-xl)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>가장 자주 넘어온 번호</div>
          <div className="ball-row spread" style={{ flexWrap: 'nowrap' }}>
            {summary.top.map(t => (
              <div key={t.n} style={{ textAlign: 'center' }}>
                <LottoBall number={t.n} />
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)', marginTop: 2 }}>{t.count}번</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-inset" style={{ marginTop: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <LottoBall number={summary.longest.n} size="sm" />
          <span style={{ fontSize: 'var(--fs-sm)' }}>
            최장 연속 출현 <strong>{summary.longest.len}회</strong>
            <span style={{ color: 'var(--ink-3)' }}> · {summary.longest.from}~{summary.longest.from + summary.longest.len - 1}회</span>
          </span>
        </div>
      </section>

      <h2 className="section-title" style={{ margin: 'var(--space-xl) 0 var(--space-sm)' }}>회차별 이월</h2>
      <p className="section-subtitle">색이 찬 공이 지난 회차에서 넘어온 번호예요. 작은 숫자는 몇 회째 이어졌는지예요.</p>
      <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
        {rows.map(d => {
          const carried = carriedFrom(d, withBonus)
          return (
            <div key={d.round} className="carry-row">
              <div className="carry-head">
                <strong>{d.round}회</strong>
                {carried.length > 0
                  ? <span className="chip chip-accent" style={{ padding: '1px 8px' }}>이월 {carried.length}</span>
                  : <span className="eyebrow">이월 없음</span>}
              </div>
              <div className="ball-row nowrap" style={{ gap: 4 }}>
                {d.numbers.map(n => <CarryBall key={n} n={n} round={d.round} carried={carried} withBonus={withBonus} />)}
                <span className="ball-divider" style={{ margin: 0 }}>+</span>
                <CarryBall n={d.bonus} round={d.round} carried={withBonus ? carried : []} withBonus={withBonus} bonus />
              </div>
            </div>
          )
        })}
      </div>
      {shown < ALL_DRAWS.length && (
        <button className="btn btn-secondary btn-full" style={{ marginTop: 'var(--space-md)' }} onClick={() => setShown(s => s + PAGE * 2)}>
          이전 회차 더 보기
        </button>
      )}
    </>
  )
}

function CarryBall({ n, round, carried, withBonus, bonus }) {
  const hit = carried.includes(n)
  return (
    <span className="hit-wrap">
      <LottoBall number={n} size="sm" ring={!hit} bonus={bonus} />
      {hit && <span className="streak-mark">{carryStreak(n, round, withBonus)}</span>}
    </span>
  )
}
