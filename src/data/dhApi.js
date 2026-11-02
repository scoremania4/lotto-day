/* 동행복권 응답 → 앱 데이터 변환 (동기화 스크립트와 앱이 함께 사용)
   비공식 내부 주소라 사이트 개편 시 여기만 고치면 됨 */
export const DH_ORIGIN = 'https://www.dhlottery.co.kr'
export const DH_HEADERS = { 'X-Requested-With': 'XMLHttpRequest', Referer: `${DH_ORIGIN}/lt645/result` }

export const drawsPath = (round = 'all') => `/lt645/selectPstLt645Info.do?srchLtEpsd=${round}`
export const storesPath = (round) => `/wnprchsplcsrch/selectLtWnShp.do?srchLtEpsd=${round}&srchLtGameKndCd=LT645`

// [회차, 날짜, n1..n6, 보너스, 1등 1인당, 1등 인원, 2등, 3등, 4등, 5등 1인당]
export const toDrawRow = (d) => [
  d.ltEpsd,
  `${d.ltRflYmd.slice(0, 4)}-${d.ltRflYmd.slice(4, 6)}-${d.ltRflYmd.slice(6, 8)}`,
  d.tm1WnNo, d.tm2WnNo, d.tm3WnNo, d.tm4WnNo, d.tm5WnNo, d.tm6WnNo,
  d.bnsWnNo,
  d.rnk1WnAmt, d.rnk1WnNope, d.rnk2WnAmt, d.rnk3WnAmt, d.rnk4WnAmt, d.rnk5WnAmt,
]

export const isValidRow = (r) => r && r.slice(2, 9).every(n => n >= 1 && n <= 45)

export const toStore = (s) => ({
  rank: s.wnShpRnk,
  name: s.shpNm,
  addr: s.shpAddr,
  region: s.region,
  mode: s.atmtPsvYnTxt,
  lat: s.shpLat,
  lng: s.shpLot,
})
