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
  // 맨 아래 회차에서 이어지는 선까지 그리려면 한 회차 더 필요
  const rows = useMemo(() => ALL_DRAWS.slice(-(shown + 1)).reverse(), [shown])
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
      <p className="section-subtitle">지난 회차에서 넘어온 번호는 색이 찬 공이고, 선으로 이어져 있어요. 선 위의 숫자는 몇 회째 이어졌는지예요.</p>
      <div className="card" style={{ padding: 'var(--space-sm)' }}>
        <CarryChart rows={rows} withBonus={withBonus} />
      </div>
      {shown < ALL_DRAWS.length && (
        <button className="btn btn-secondary btn-full" style={{ marginTop: 'var(--space-md)' }} onClick={() => setShown(s => s + PAGE * 2)}>
          이전 회차 더 보기
        </button>
      )}
    </>
  )
}

// 회차 한 줄 = 공 6개 + 보너스. 위가 최신, 아래로 갈수록 과거
const ROW_H = 76, BALL_R = 14, LABEL_W = 50
const SLOT_X = [...Array.from({ length: 6 }, (_, i) => LABEL_W + 22 + i * 40), LABEL_W + 22 + 5 * 40 + 52] // 마지막 = 보너스
const PLUS_X = LABEL_W + 22 + 5 * 40 + 26
const CHART_W = SLOT_X[6] + BALL_R + 10
const BALL_VAR = ['--ball-1', '--ball-2', '--ball-3', '--ball-4', '--ball-5']
const ballVar = (n) => `var(${BALL_VAR[n <= 10 ? 0 : n <= 20 ? 1 : n <= 30 ? 2 : n <= 40 ? 3 : 4]})`

// 한 회차에서 번호 n 의 칸 번호 (없으면 -1). 보너스는 6번 칸
function slotOf(d, n, withBonus) {
  const i = d.numbers.indexOf(n)
  if (i >= 0) return i
  return withBonus && d.bonus === n ? 6 : -1
}

function CarryChart({ rows, withBonus }) {
  const H = rows.length * ROW_H
  const cy = (r) => r * ROW_H + ROW_H / 2
  const links = []
  const labels = {}
  rows.forEach((d, r) => {
    const older = rows[r + 1]
    if (!older) return
    carriedFrom(d, withBonus).forEach(n => {
      const a = slotOf(d, n, withBonus), b = slotOf(older, n, withBonus)
      if (a >= 0 && b >= 0) links.push({ n, r, a, b, streak: carryStreak(n, d.round, withBonus) })
    })
  })

  return (
    <svg viewBox={`0 0 ${CHART_W} ${H}`} className="carry-chart" role="img" aria-label="회차별 이월수 연결도">
      {/* 선 먼저 (공 뒤에 깔림) */}
      {links.map(({ n, r, a, b, streak }) => {
        const x1 = SLOT_X[a], y1 = cy(r) + BALL_R, x2 = SLOT_X[b], y2 = cy(r + 1) - BALL_R
        return <line key={`${r}-${n}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ballVar(n)} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      })}

      {rows.map((d, r) => {
        const carried = carriedFrom(d, withBonus)
        const cnt = r < rows.length - 1 ? carried.length : null
        return (
          <g key={d.round}>
            <text x={4} y={cy(r) - 2} className="cc-round">{d.round}회</text>
            <text x={4} y={cy(r) + 14} className={`cc-sub${cnt ? ' on' : ''}`}>{cnt == null ? '' : cnt ? `이월 ${cnt}` : '이월 없음'}</text>
            {d.numbers.map((n, i) => <ChartBall key={n} n={n} x={SLOT_X[i]} y={cy(r)} on={carried.includes(n)} />)}
            <text x={PLUS_X} y={cy(r) + 6} textAnchor="middle" className="cc-plus">+</text>
            <ChartBall n={d.bonus} x={SLOT_X[6]} y={cy(r)} on={withBonus && carried.includes(d.bonus)} bonus />
          </g>
        )
      })}

      {/* 몇 회째 이어졌는지: 선 위 작은 표시 (다른 표시와 겹치면 선을 따라 비켜 놓음) */}
      {links.map((l) => {
        const placed = labels[l.r] ??= []
        const x1 = SLOT_X[l.a], x2 = SLOT_X[l.b], y1 = cy(l.r) + BALL_R, y2 = cy(l.r + 1) - BALL_R
        let pt
        for (const t of [0.5, 0.32, 0.68, 0.2, 0.8]) {
          pt = { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t }
          if (placed.every(q => Math.hypot(q.x - pt.x, q.y - pt.y) >= 22)) break
        }
        placed.push(pt)
        const { r, n, streak } = l
        const mx = pt.x, my = pt.y
        return (
          <g key={`s${r}-${n}`}>
            <circle cx={mx} cy={my} r={9} className="cc-streak-bg" />
            <text x={mx} y={my + 4} textAnchor="middle" className="cc-streak">{streak}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ChartBall({ n, x, y, on, bonus }) {
  const c = ballVar(n)
  return (
    <g>
      <circle cx={x} cy={y} r={BALL_R} fill={on ? c : 'var(--card)'} stroke={c} strokeWidth={2} />
      {bonus && <circle cx={x} cy={y} r={BALL_R + 3.5} fill="none" stroke="var(--ink-3)" strokeWidth={1.4} strokeDasharray="3 2.5" />}
      <text x={x} y={y + 5} textAnchor="middle" className="cc-num" style={{ fill: on ? (n <= 10 ? '#4A3200' : '#fff') : c }}>{n}</text>
    </g>
  )
}
