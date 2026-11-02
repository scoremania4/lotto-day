/* 매주 토요일 20:55 새 회차 자동 반영
   - 앱을 켤 때 놓친 회차가 있으면 바로 받아옴
   - 발표가 늦으면 5분 간격으로 2시간까지 다시 시도
   - 기기 시간이 한국 시간이라고 가정 */
import { ALL_DRAWS, addDraws } from '../data/lottoHistory'
import { drawsPath, toDrawRow, isValidRow } from '../data/dhApi'

const WEEK = 7 * 24 * 60 * 60 * 1000
const FIRST_UPDATE = new Date(2002, 11, 7, 20, 55) // 1회 추첨일 20:55
const RETRY_MS = 5 * 60 * 1000
const MAX_RETRY = 24

// 지금 시점에 나와 있어야 할 최신 회차
export const expectedLatest = (now = new Date()) => Math.floor((now - FIRST_UPDATE) / WEEK) + 1
// 다음 토요일 20:55
export const nextUpdateAt = (now = new Date()) => new Date(FIRST_UPDATE.getTime() + expectedLatest(now) * WEEK)

async function fetchRound(round) {
  const res = await fetch(`/api/dh${drawsPath(round)}`)
  if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return null
  const d = (await res.json())?.data?.list?.find(x => x.ltEpsd === round)
  const row = d && toDrawRow(d)
  return isValidRow(row) ? row : null
}

export async function updateDraws() {
  const want = expectedLatest()
  const rows = []
  for (let r = ALL_DRAWS.length + 1; r <= want; r++) {
    const row = await fetchRound(r)
    if (!row) break // 아직 발표 전
    rows.push(row)
  }
  if (rows.length) addDraws(rows)
  return { added: rows.length, missing: want - ALL_DRAWS.length }
}

// 정적 배포(GitHub Pages)에는 /api/dh 프록시가 없음 → 배포된 앱은 Actions 가 새로 빌드해 갱신
export function startAutoUpdate(onAdded) {
  if (!import.meta.env.DEV) return () => {}
  let timer
  const run = async (retry = 0) => {
    let res = { added: 0, missing: 1 }
    try { res = await updateDraws() } catch { /* 네트워크 오류는 재시도 */ }
    if (res.added) onAdded(ALL_DRAWS.length)
    timer = res.missing > 0 && retry < MAX_RETRY
      ? setTimeout(() => run(retry + 1), RETRY_MS)
      : setTimeout(() => run(0), nextUpdateAt() - Date.now())
  }
  run()
  return () => clearTimeout(timer)
}
