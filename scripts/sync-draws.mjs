// 동행복권 전체 회차 당첨번호 + 최신 회차 당첨 판매점을 src/data 에 저장
// 실행: npm run sync  (빌드 전 자동 실행, 실패하면 기존 파일 유지)
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { DH_ORIGIN, DH_HEADERS, drawsPath, storesPath, toDrawRow, isValidRow, toStore } from '../src/data/dhApi.js'

const DRAWS = new URL('../src/data/draws.json', import.meta.url)
const STORES = new URL('../src/data/stores.json', import.meta.url)

// 일시적인 네트워크 오류는 최대 4번까지 다시 시도 (5초 간격)
async function getJson(path, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(DH_ORIGIN + path, { headers: { ...DH_HEADERS, 'User-Agent': 'Mozilla/5.0' } })
      if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error(`${res.status} ${path}`)
      return await res.json()
    } catch (e) {
      if (i >= tries) throw e
      console.error(`재시도 ${i}/${tries - 1}: ${e.message}`)
      await new Promise(r => setTimeout(r, 5000))
    }
  }
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
  // 판매점 집계(21:15쯤)가 끝나기 전이면 비어 있음 → 지난 회차 데이터를 비운 채로 덮어쓰지 않음
  if (list.length || !existsSync(STORES)) {
    writeFileSync(STORES, JSON.stringify({ round, list }) + '\n')
    console.log(`제 ${round}회 당첨 판매점 ${list.length}곳 저장`)
  } else console.log(`제 ${round}회 당첨 판매점 아직 집계 전 — 이전 판매점 데이터 유지`)
} catch (e) {
  console.error(`동기화 실패: ${e.message} — 기존 데이터를 유지합니다`)
  // 배포(CI)에서는 낡은 데이터로 조용히 배포하지 않고 실패로 알림
  process.exit(!process.env.CI && existsSync(DRAWS) && existsSync(STORES) ? 0 : 1)
}
