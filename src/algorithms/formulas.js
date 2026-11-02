/* ============================================================
   로또 공식 & 이월수 분석 (전 회차 기준)
   ============================================================ */
import { ALL_DRAWS } from '../data/lottoHistory'

const prevOf = (draw) => ALL_DRAWS[draw.round - 2]

// AC값: 서로 다른 두 수 차이의 종류 수 - 5
function acValue(nums) {
  const diffs = new Set()
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++) diffs.add(nums[j] - nums[i])
  return diffs.size - 5
}

const pool = (d, withBonus) => (withBonus ? [...d.numbers, d.bonus] : d.numbers)

// 직전 회차에서 다시 나온 번호 (보너스 포함 시 출발·도착 모두 보너스 포함)
export function carriedFrom(draw, withBonus = false) {
  const prev = prevOf(draw)
  if (!prev) return []
  const src = pool(prev, withBonus)
  return pool(draw, withBonus).filter(n => src.includes(n))
}

// n이 이 회차까지 몇 회 연속 이월됐는지 (1 = 지난 회차에서 처음 넘어옴)
export function carryStreak(n, round, withBonus = false) {
  let k = 0
  while (round - k - 2 >= 0 && pool(ALL_DRAWS[round - k - 2], withBonus).includes(n)) k++
  return k
}

// 각 공식: 값 계산 + 비교용 키(같은 키끼리 역대 비율)
export const FORMULAS = [
  {
    id: 'sum', label: '합계', desc: '여섯 번호를 모두 더한 값',
    calc: d => d.numbers.reduce((a, b) => a + b, 0),
    key: v => Math.floor((v - 1) / 20),
    keyLabel: v => { const k = Math.floor((v - 1) / 20); return `${k * 20 + 1}~${k * 20 + 20}` },
  },
  {
    id: 'oddEven', label: '홀짝', desc: '홀수 : 짝수',
    calc: d => { const o = d.numbers.filter(n => n % 2).length; return `${o}:${6 - o}` },
  },
  {
    id: 'highLow', label: '저고', desc: '1~22 : 23~45',
    calc: d => { const l = d.numbers.filter(n => n <= 22).length; return `${l}:${6 - l}` },
  },
  {
    id: 'ac', label: 'AC값', desc: '번호 간격이 얼마나 다양한지 (0~10)',
    calc: d => acValue(d.numbers),
  },
  {
    id: 'consec', label: '연번', desc: '바로 이어지는 번호 쌍의 수',
    calc: d => d.numbers.slice(1).filter((n, i) => n - d.numbers[i] === 1).length,
  },
  {
    id: 'endSum', label: '끝수합', desc: '일의 자리 숫자를 더한 값',
    calc: d => d.numbers.reduce((a, n) => a + (n % 10), 0),
    key: v => Math.floor(v / 5),
    keyLabel: v => { const k = Math.floor(v / 5); return `${k * 5}~${k * 5 + 4}` },
  },
  {
    id: 'carry', label: '이월수', desc: '지난 회차 번호가 다시 나온 개수',
    calc: d => carriedFrom(d, false).length,
  },
  {
    id: 'neighbor', label: '이웃수', desc: '지난 회차 번호의 ±1이 나온 개수',
    calc: d => {
      const prev = prevOf(d)
      if (!prev) return 0
      return d.numbers.filter(n => !prev.numbers.includes(n) && (prev.numbers.includes(n - 1) || prev.numbers.includes(n + 1))).length
    },
  },
]

let distCache = null
let distFor = 0 // 계산 당시 회차 수
// 공식별 키 → 회차 수 (2회차부터; 이월·이웃은 직전 회차가 필요)
function distributions() {
  if (distCache && distFor === ALL_DRAWS.length) return distCache
  distFor = ALL_DRAWS.length
  distCache = {}
  for (const f of FORMULAS) {
    const m = new Map()
    for (const d of ALL_DRAWS.slice(1)) {
      const k = (f.key || (v => v))(f.calc(d))
      m.set(k, (m.get(k) || 0) + 1)
    }
    distCache[f.id] = m
  }
  return distCache
}

export function analyzeDraw(draw) {
  const dist = distributions()
  const total = ALL_DRAWS.length - 1
  return FORMULAS.map(f => {
    const value = f.calc(draw)
    const count = dist[f.id].get((f.key || (v => v))(value)) || 0
    const max = Math.max(...dist[f.id].values())
    return {
      ...f,
      value,
      bucket: f.keyLabel ? f.keyLabel(value) : null,
      pct: Math.round((count / total) * 1000) / 10,
      isMode: count === max,
    }
  })
}

export function zoneCounts(numbers) {
  const z = [0, 0, 0, 0, 0]
  numbers.forEach(n => z[Math.min(Math.floor((n - 1) / 10), 4)]++)
  return z
}

// 이월수 전체 요약
export function carrySummary(withBonus) {
  const dist = [0, 0, 0, 0] // 0, 1, 2, 3개 이상
  const byNumber = Array(46).fill(0)
  let total = 0
  for (const d of ALL_DRAWS.slice(1)) {
    const c = carriedFrom(d, withBonus)
    dist[Math.min(c.length, 3)]++
    c.forEach(n => byNumber[n]++)
    total += c.length
  }
  const rounds = ALL_DRAWS.length - 1
  const top = byNumber
    .map((count, n) => ({ n, count }))
    .slice(1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 같은 번호 연속 출현 최장 기록
  let best = { n: 0, len: 0, from: 0 }
  for (let n = 1; n <= 45; n++) {
    let run = 0
    ALL_DRAWS.forEach((d, i) => {
      if (pool(d, withBonus).includes(n)) {
        run++
        if (run > best.len) best = { n, len: run, from: i + 2 - run }
      } else run = 0
    })
  }

  return { rounds, dist, avg: total / rounds, top, longest: best }
}
