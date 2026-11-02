/* 매주 토요일 20:55 새 회차 자동 반영 (추첨 20:35, 번호 공개 20:50쯤)
   - 앱을 켤 때 놓친 회차가 있으면 바로 받아옴
   - 발표가 늦으면 5분 간격으로 3시간까지 다시 시도
   - 기기 시간이 한국 시간이라고 가정 */
import { ALL_DRAWS, addDraws } from '../data/lottoHistory'
import { drawsPath, toDrawRow, isValidRow } from '../data/dhApi'
import { dhUrl, dhInit, PUBLISHED_DRAWS } from './net'

const WEEK = 7 * 24 * 60 * 60 * 1000
const FIRST_UPDATE = new Date(2002, 11, 7, 20, 55) // 1회 추첨일 20:55
const RETRY_MS = 5 * 60 * 1000
const MAX_RETRY = 36

// 지금 시점에 나와 있어야 할 최신 회차
export const expectedLatest = (now = new Date()) => Math.floor((now - FIRST_UPDATE) / WEEK) + 1
// 다음 토요일 20:55
export const nextUpdateAt = (now = new Date()) => new Date(FIRST_UPDATE.getTime() + expectedLatest(now) * WEEK)

// 1순위: 동행복권 직접(앱·개발 서버), 2순위: 배포 사이트의 draws.json (웹은 이쪽만)
async function fromDhlottery(round) {
  const url = dhUrl(drawsPath(round))
  if (!url) return null
  const res = await fetch(url, dhInit())
  if (!res.ok) return null
  const d = (await res.json())?.data?.list?.find(x => x.ltEpsd === round)
  const row = d && toDrawRow(d)
  return isValidRow(row) ? row : null
}

async function fromPublished(round) {
  const res = await fetch(`${PUBLISHED_DRAWS}?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) return null
  const row = (await res.json()).find(r => r[0] === round)
  return isValidRow(row) ? row : null
}

async function fetchRound(round) {
  try { const row = await fromDhlottery(round); if (row) return row } catch { /* 다음 방법으로 */ }
  try { return await fromPublished(round) } catch { return null }
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

export function startAutoUpdate(onAdded) {
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
