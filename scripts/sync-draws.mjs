// 동행복권 전체 회차 당첨번호 + 최신 회차 당첨 판매점을 src/data 에 저장
// 실행: npm run sync  (빌드 전 자동 실행, 실패하면 기존 파일 유지)
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { DH_ORIGIN, DH_HEADERS, drawsPath, storesPath, toDrawRow, isValidRow, toStore } from '../src/data/dhApi.js'

const DRAWS = new URL('../src/data/draws.json', import.meta.url)
const STORES = new URL('../src/data/stores.json', import.meta.url)

async function getJson(path) {
  const res = await fetch(DH_ORIGIN + path, { headers: { ...DH_HEADERS, 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error(`${res.status} ${path}`)
  return res.json()
}

try {
  const rows = ((await getJson(drawsPath('all')))?.data?.list ?? []).map(toDrawRow).sort((a, b) => a[0] - b[0])
  // 이빨 빠진 회차가 있으면 저장하지 않음
  if (!rows.length || rows.some((r, i) => r[0] !== i + 1 || !isValidRow(r))) throw new Error('응답 형식이 예상과 다름')
  const prev = existsSync(DRAWS) ? JSON.parse(readFileSync(DRAWS, 'utf8')).length : 0
  writeFileSync(DRAWS, '[\n' + rows.map(r => JSON.stringify(r)).join(',\n') + '\n]\n')
  console.log(`당첨번호 1~${rows.length}회 저장 (새로 ${rows.length - prev}회)`)

  const round = rows.length
  const list = ((await getJson(storesPath(round)))?.data?.list ?? []).map(toStore)
  writeFileSync(STORES, JSON.stringify({ round, list }) + '\n')
  console.log(`제 ${round}회 당첨 판매점 ${list.length}곳 저장`)
} catch (e) {
  console.error(`동기화 실패: ${e.message} — 기존 데이터를 유지합니다`)
  // 배포(CI)에서는 낡은 데이터로 조용히 배포하지 않고 실패로 알림
  process.exit(!process.env.CI && existsSync(DRAWS) && existsSync(STORES) ? 0 : 1)
}
