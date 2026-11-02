// 동행복권 QR 링크(예: ...?v=1248q010203040506...) 또는 숫자 6개 텍스트에서 회차와 번호 줄을 꺼냄
// strict: 복권 QR 형식(v=...)만 인정. 카메라에서는 켜서 다른 QR의 숫자를 번호로 오해하지 않게 함
export function parseQR(text, fallbackRound, strict = false) {
  const games = []
  let round = fallbackRound
  const v = text.match(/v=([0-9a-zA-Z]+)/)?.[1]
  if (v) {
    const r = parseInt(v.substring(0, 4), 10)
    if (r > 0) round = r
    v.slice(4).split(/[a-z]/i).filter(Boolean).forEach(chunk => {
      const nums = []
      for (let i = 0; i + 2 <= 12 && i < chunk.length; i += 2) {
        const n = parseInt(chunk.substring(i, i + 2), 10)
        if (n >= 1 && n <= 45) nums.push(n)
      }
      if (nums.length === 6) games.push(nums.sort((a, b) => a - b))
    })
  }
  if (!games.length && !strict) {
    const nums = text.match(/\b([1-9]|[1-3][0-9]|4[0-5])\b/g)
    if (nums?.length >= 6) games.push(nums.slice(0, 6).map(Number).sort((a, b) => a - b))
  }
  return { round, games }
}
