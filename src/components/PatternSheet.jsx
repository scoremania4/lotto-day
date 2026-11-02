import React from 'react'

// 밑그림 색: 1회 전 파랑 / 2회 전 초록 / 3회 전 보라
export const LAYERS = [
  { label: '1회 전', color: '#3E73B8', opacity: 0.82 },
  { label: '2회 전', color: '#3A9A60', opacity: 0.72 },
  { label: '3회 전', color: '#8A5BC4', opacity: 0.62 },
]

const COLS = 7, CW = 46, CH = 50, PAD = 8
const pos = (n) => ({ x: PAD + ((n - 1) % COLS) * CW + CW / 2, y: PAD + Math.floor((n - 1) / COLS) * CH + CH / 2 })
const pts = (nums) => [...nums].sort((a, b) => a - b).map(n => { const p = pos(n); return `${p.x},${p.y}` }).join(' ')
const pill = (n, props) => { const { x, y } = pos(n); return <rect key={n} x={x - 15} y={y - 19} width={30} height={38} rx={15} {...props} /> }

/**
 * 로또 용지 위 패턴 그림
 * draw  : 먹색으로 그릴 회차 (없으면 생략)
 * under : [{ draw, layer }] 밑그림, 0번이 가장 가까운 회차
 * marks : 내가 고른 번호 (주홍) / fixed: 단골 번호 (작은 점)
 * onMark: 있으면 칸을 눌러 마킹
 */
export default function PatternSheet({ draw, under = [], showBonus, marks = [], fixed = [], onMark }) {
  const W = PAD * 2 + COLS * CW, H = PAD * 2 + 7 * CH
  const underNums = new Set(under.flatMap(u => u.draw.numbers))
  const drawNums = draw ? draw.numbers : []

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pattern-sheet" aria-label="로또 용지 패턴표">
      {Array.from({ length: 45 }, (_, i) => {
        const { x, y } = pos(i + 1)
        return <rect key={i} x={x - 15} y={y - 19} width={30} height={38} rx={5} className="ps-cell" />
      })}

      {/* 밑그림: 오래된 회차부터 깔기 */}
      {[...under].reverse().map(({ draw: d, layer }) => (
        <g key={d.round} style={{ opacity: layer.opacity, color: layer.color }}>
          <polyline points={pts(d.numbers)} fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" />
          {d.numbers.map(n => pill(n, { fill: 'currentColor' }))}
        </g>
      ))}

      {draw && (
        <>
          <polyline points={pts(draw.numbers)} fill="none" style={{ stroke: 'var(--ink)' }} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
          {showBonus && (() => { const { x, y } = pos(draw.bonus); return <rect x={x - 17} y={y - 21} width={34} height={42} rx={17} fill="none" style={{ stroke: 'var(--ink)' }} strokeWidth={2} strokeDasharray="4 3" /> })()}
          {draw.numbers.map(n => pill(n, { style: { fill: 'var(--ink)' } }))}
        </>
      )}

      {/* 내 마킹 */}
      {marks.length > 1 && <polyline points={pts(marks)} fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth={3} strokeDasharray="7 5" strokeLinejoin="round" strokeLinecap="round" />}
      {marks.map(n => pill(n, { style: { fill: 'var(--accent)' }, className: 'ps-mark' }))}

      {Array.from({ length: 45 }, (_, i) => {
        const n = i + 1
        const { x, y } = pos(n)
        const cls = marks.includes(n) || drawNums.includes(n) ? 'on' : underNums.has(n) ? 'under' : ''
        return <text key={n} x={x} y={y + 6} textAnchor="middle" className={`ps-num ${cls}`}>{n}</text>
      })}

      {fixed.map(n => { const { x, y } = pos(n); return <circle key={n} cx={x + 14} cy={y - 18} r={5.5} style={{ fill: 'var(--accent)', stroke: '#FFFEFB' }} strokeWidth={2} /> })}

      {onMark && Array.from({ length: 45 }, (_, i) => {
        const n = i + 1
        const { x, y } = pos(n)
        const marked = marks.includes(n)
        return (
          <rect
            key={n}
            x={x - CW / 2}
            y={y - CH / 2}
            width={CW}
            height={CH}
            className="ps-hit"
            role="button"
            tabIndex={0}
            aria-pressed={marked}
            aria-label={`${n}번${fixed.includes(n) ? ', 단골 번호' : ''}`}
            onClick={() => onMark(n)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMark(n) } }}
          />
        )
      })}
    </svg>
  )
}

export function LegendRow({ color, label, sub, draw, strong, off, onToggle }) {
  const Tag = onToggle ? 'button' : 'div'
  return (
    <Tag className={`legend-row${off ? ' off' : ''}`} onClick={onToggle} aria-pressed={onToggle ? !off : undefined}>
      <span className="legend-swatch" style={{ background: color }} />
      <span className="legend-label">
        <strong style={{ color: strong ? 'var(--ink)' : color }}>{label}</strong>
        <span>{sub}</span>
      </span>
      <span className="legend-nums">
        {draw.numbers.join(' ')} <span style={{ color: 'var(--ink-3)' }}>+{draw.bonus}</span>
      </span>
    </Tag>
  )
}
