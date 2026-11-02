/* ============================================================
   역대 로또 당첨 데이터 (1회~최신)
   src/data/draws.json 은 `npm run sync` 로 동행복권에서 갱신
   ============================================================ */
import RAW from './draws.json';

const EXTRA_KEY = 'lotto_extraDraws'; // 앱이 자동 업데이트로 받은 회차

const toDraw = ([round, date, n1, n2, n3, n4, n5, n6, bonus, a1, w1, a2, a3, a4, a5]) => ({
  round,
  date,
  numbers: [n1, n2, n3, n4, n5, n6],
  bonus,
  prize1: a1,
  winners1: w1,
  prizes: [a1, a2, a3, a4, a5],
});

// 오름차순: ALL_DRAWS[i].round === i + 1 (새 회차가 들어오면 그대로 이어 붙임)
export const ALL_DRAWS = RAW.map(toDraw);
// 최근 15회 (최신순)
export const RECENT_RESULTS = [];

export const findDraw = (round) => ALL_DRAWS[round - 1];

function append(rows) {
  rows.forEach(r => { if (r[0] === ALL_DRAWS.length + 1) ALL_DRAWS.push(toDraw(r)); });
  RECENT_RESULTS.splice(0, RECENT_RESULTS.length, ...ALL_DRAWS.slice(-15).reverse());
}

function loadExtra() {
  try { return JSON.parse(localStorage.getItem(EXTRA_KEY) || '[]'); } catch { return []; }
}

export function addDraws(rows) {
  append(rows);
  try {
    const extra = [...loadExtra(), ...rows].filter(r => r[0] > RAW.length);
    localStorage.setItem(EXTRA_KEY, JSON.stringify(extra));
  } catch { /* 저장 실패해도 이번 실행에서는 반영됨 */ }
}

append(typeof localStorage === 'undefined' ? [] : loadExtra());

// ── 출현 빈도 계산 ──
export function calculateFrequency(results) {
  const freq = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  
  results.forEach(r => {
    r.numbers.forEach(n => freq[n]++);
  });
  
  return freq;
}

// ── 미출현 회차 계산 ──
export function calculateColdMap(results) {
  const lastSeen = {};
  for (let i = 1; i <= 45; i++) lastSeen[i] = 999;
  
  results.forEach((r, idx) => {
    r.numbers.forEach(n => {
      if (lastSeen[n] === 999 || idx < lastSeen[n]) {
        lastSeen[n] = idx;
      }
    });
  });
  
  return lastSeen;
}

// ── 동반 출현 매트릭스 생성 ──
export function buildCooccurrenceMatrix(results) {
  const matrix = {};
  for (let i = 1; i <= 45; i++) {
    matrix[i] = {};
    for (let j = 1; j <= 45; j++) {
      if (i !== j) matrix[i][j] = 0;
    }
  }
  
  results.forEach(r => {
    for (let i = 0; i < r.numbers.length; i++) {
      for (let j = i + 1; j < r.numbers.length; j++) {
        const a = r.numbers[i];
        const b = r.numbers[j];
        matrix[a][b]++;
        matrix[b][a]++;
      }
    }
  });
  
  return matrix;
}

// ── 가장 최근 당첨 결과 ──
export function getLatestResult() {
  return RECENT_RESULTS[0];
}

// ── 직전 당첨 번호 ──
export function getPrevWinningNumbers() {
  return RECENT_RESULTS[0]?.numbers || [];
}
