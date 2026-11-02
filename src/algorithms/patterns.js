/* ============================================================
   로또 당첨되는 날 - 17종 패턴 추천 엔진
   모든 연산은 온디바이스(클라이언트)에서 수행
   ============================================================ */

// ── OMR 그리드 좌표 변환 (번호 → 행/열) ──
// OMR 용지: 7열 x 7행 (1~45번, 나머지 빈 칸)
export function numToGrid(num) {
  const idx = num - 1;
  return { row: Math.floor(idx / 7), col: idx % 7 };
}

export function gridToNum(row, col) {
  const num = row * 7 + col + 1;
  return num >= 1 && num <= 45 ? num : null;
}

// ── 로또 공 색상 범위 ──
export function getBallRange(num) {
  if (num <= 10) return 1;
  if (num <= 20) return 2;
  if (num <= 30) return 3;
  if (num <= 40) return 4;
  return 5;
}

// ============================================================
// 17가지 패턴 알고리즘 정의
// ============================================================

export const PATTERNS = [
  {
    id: 'threeZone',
    name: '3자 패턴',
    emoji: '🎯',
    desc: '번호를 3구간으로 나눠 골고루 배치해요',
    defaultWeight: 100,
  },
  {
    id: 'sandwich',
    name: '이빨 빠진 수',
    emoji: '🥪',
    desc: '연속 번호 사이의 빈자리를 찾아요',
    defaultWeight: 100,
  },
  {
    id: 'vertexCarryover',
    name: '3자 꼭짓점 이월',
    emoji: '📐',
    desc: '지난주 OMR 삼각형 꼭짓점 기운을 이어받아요',
    defaultWeight: 100,
  },
  {
    id: 'roundNumber',
    name: '회차별 숫자 패턴',
    emoji: '🔢',
    desc: '이번 회차 번호의 숫자를 분해해서 매칭해요',
    defaultWeight: 100,
  },
  {
    id: 'datePattern',
    name: '추첨일 패턴',
    emoji: '📅',
    desc: '추첨 날짜의 월·일 숫자를 활용해요',
    defaultWeight: 100,
  },
  {
    id: 'holiday',
    name: '달력 빨간날 패턴',
    emoji: '🔴',
    desc: '이번 주 공휴일 날짜를 번호에 반영해요',
    defaultWeight: 100,
  },
  {
    id: 'neighbor',
    name: '이웃수 파도타기',
    emoji: '🌊',
    desc: '지난주 당첨 번호 바로 옆 숫자를 가져와요',
    defaultWeight: 100,
  },
  {
    id: 'sameEnding',
    name: '끝수 동시 출현',
    emoji: '👯',
    desc: '끝자리가 같은 짝꿍 수를 1쌍 넣어요',
    defaultWeight: 100,
  },
  {
    id: 'coldRebound',
    name: '장기 미출수 반등',
    emoji: '🧊',
    desc: '오래 안 나온 번호 1개를 꼭 넣어요',
    defaultWeight: 100,
  },
  {
    id: 'diagonalCorner',
    name: '대각선·모서리 방어',
    emoji: '🛡️',
    desc: 'OMR 모서리와 대각선 번호를 챙겨요',
    defaultWeight: 100,
  },
  {
    id: 'lineBalance',
    name: '가로·세로 띠 멸종 방지',
    emoji: '📊',
    desc: '한 줄에 몰리거나 빈 줄이 없게 조정해요',
    defaultWeight: 100,
  },
  {
    id: 'mirror',
    name: '동형수 (거울수)',
    emoji: '🪞',
    desc: '12↔21처럼 뒤집으면 같은 거울 수를 매칭해요',
    defaultWeight: 100,
  },
  {
    id: 'stepping',
    name: '퐁당퐁당 (징검다리)',
    emoji: '🪨',
    desc: 'OMR에서 한 칸씩 건너뛰는 리듬감을 만들어요',
    defaultWeight: 100,
  },
  {
    id: 'cross',
    name: '십자 포위',
    emoji: '✝️',
    desc: '선택 번호의 상하좌우 이웃을 추천해요',
    defaultWeight: 100,
  },
  {
    id: 'cooccurrence',
    name: '역대 궁합수 매칭',
    emoji: '💑',
    desc: '역대 가장 많이 같이 나온 단짝 번호를 찾아요',
    defaultWeight: 100,
  },
  {
    id: 'twin',
    name: '쌍둥이 수 방어',
    emoji: '👶',
    desc: '11, 22, 33 같은 겹치는 숫자 비율을 조정해요',
    defaultWeight: 100,
  },
  {
    id: 'balance',
    name: '무게중심 (고저/홀짝)',
    emoji: '⚖️',
    desc: '홀짝·고저 비율이 치우치면 경고해요',
    defaultWeight: 100,
  },
];

// ============================================================
// 개별 패턴 분석 함수들
// ============================================================

// [1] 3자 패턴: 1~15 / 16~30 / 31~45 균등 분배
export function analyzeThreeZone(selected) {
  const zones = [0, 0, 0];
  selected.forEach(n => {
    if (n <= 15) zones[0]++;
    else if (n <= 30) zones[1]++;
    else zones[2]++;
  });
  return {
    zones,
    balanced: zones.every(z => z >= 1 && z <= 3),
    suggestion: zones.findIndex(z => z === 0),
  };
}

export function getThreeZoneCandidates(selected) {
  const analysis = analyzeThreeZone(selected);
  const candidates = [];
  if (analysis.suggestion === 0) for (let i = 1; i <= 15; i++) if (!selected.includes(i)) candidates.push(i);
  if (analysis.suggestion === 1) for (let i = 16; i <= 30; i++) if (!selected.includes(i)) candidates.push(i);
  if (analysis.suggestion === 2) for (let i = 31; i <= 45; i++) if (!selected.includes(i)) candidates.push(i);
  if (candidates.length === 0) {
    // 가장 적은 구간에서 추가
    const minZone = analysis.zones.indexOf(Math.min(...analysis.zones));
    const [start, end] = [[1, 15], [16, 30], [31, 45]][minZone];
    for (let i = start; i <= end; i++) if (!selected.includes(i)) candidates.push(i);
  }
  return candidates;
}

// [2] 이빨 빠진 수 (샌드위치)
export function getSandwichCandidates(selected) {
  const sorted = [...selected].sort((a, b) => a - b);
  const candidates = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 2) {
      const mid = sorted[i] + 1;
      if (!selected.includes(mid) && mid >= 1 && mid <= 45) {
        candidates.push(mid);
      }
    }
  }
  return candidates;
}

// [3] 3자 꼭짓점 이월 (직전 회차 기반)
export function getVertexCarryoverCandidates(prevWinning) {
  if (!prevWinning || prevWinning.length < 3) return [];
  // 직전 당첨 번호 중 3개를 선택하여 OMR 그리드 상 삼각형 무게중심 계산
  const grids = prevWinning.slice(0, 6).map(numToGrid);
  const centerRow = grids.reduce((s, g) => s + g.row, 0) / grids.length;
  const centerCol = grids.reduce((s, g) => s + g.col, 0) / grids.length;
  
  // 무게중심 주변 번호 추출
  const candidates = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = Math.round(centerRow + dr);
      const c = Math.round(centerCol + dc);
      const num = gridToNum(r, c);
      if (num && !prevWinning.includes(num)) candidates.push(num);
    }
  }
  return candidates;
}

// [4] 회차별 숫자 패턴
export function getRoundNumberCandidates(roundNumber) {
  const digits = String(roundNumber).split('').map(Number);
  const candidates = new Set();
  
  // 각 자릿수 자체
  digits.forEach(d => { if (d >= 1 && d <= 45) candidates.add(d); });
  
  // 자릿수 합
  const sum = digits.reduce((a, b) => a + b, 0);
  if (sum >= 1 && sum <= 45) candidates.add(sum);
  
  // 회차 mod 45
  const mod = roundNumber % 45;
  if (mod >= 1) candidates.add(mod);
  
  // 끝수 매칭 (끝 두 자리)
  const lastTwo = roundNumber % 100;
  if (lastTwo >= 1 && lastTwo <= 45) candidates.add(lastTwo);
  
  return [...candidates];
}

// [5] 추첨일(날짜) 패턴
export function getDatePatternCandidates(drawDate) {
  const date = new Date(drawDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const candidates = new Set();
  
  if (month >= 1 && month <= 45) candidates.add(month);
  if (day >= 1 && day <= 45) candidates.add(day);
  
  const sum = month + day;
  if (sum >= 1 && sum <= 45) candidates.add(sum);
  
  const diff = Math.abs(month - day);
  if (diff >= 1 && diff <= 45) candidates.add(diff);
  
  // 월*일
  const product = month * day;
  if (product >= 1 && product <= 45) candidates.add(product);
  
  return [...candidates];
}

// [6] 달력 빨간날 패턴
export function getHolidayCandidates(drawDate) {
  // 2026년 한국 공휴일 (고정 + 주요 공휴일)
  const holidays2026 = {
    1: [1], 2: [9, 10, 11], 3: [1], 4: [], 5: [5, 18],
    6: [6], 7: [], 8: [15], 9: [24, 25, 26], 10: [3, 9],
    11: [], 12: [25]
  };
  
  const date = new Date(drawDate);
  const month = date.getMonth() + 1;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  
  const candidates = new Set();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (holidays2026[m]?.includes(day)) {
      if (day >= 1 && day <= 45) candidates.add(day);
    }
  }
  
  // 공휴일이 없는 주에도 월+일 기반 후보 제공
  if (candidates.size === 0) {
    const dd = date.getDate();
    if (dd >= 1 && dd <= 45) candidates.add(dd);
  }
  
  return [...candidates];
}

// [7] 이웃수 파도타기
export function getNeighborCandidates(prevWinning) {
  if (!prevWinning || prevWinning.length === 0) return [];
  const candidates = new Set();
  prevWinning.forEach(n => {
    if (n - 1 >= 1) candidates.add(n - 1);
    if (n + 1 <= 45) candidates.add(n + 1);
  });
  // 직전 당첨 번호 자체는 제외
  prevWinning.forEach(n => candidates.delete(n));
  return [...candidates];
}

// [8] 끝수 동시 출현
export function getSameEndingCandidates(selected) {
  const endingGroups = {};
  for (let i = 1; i <= 45; i++) {
    const ending = i % 10;
    if (!endingGroups[ending]) endingGroups[ending] = [];
    endingGroups[ending].push(i);
  }
  
  const candidates = [];
  selected.forEach(n => {
    const ending = n % 10;
    const partners = endingGroups[ending].filter(x => x !== n && !selected.includes(x));
    candidates.push(...partners);
  });
  return [...new Set(candidates)];
}

// [9] 장기 미출수 반등 (Cold Number)
export function getColdNumberCandidates(frequencyMap, recentRounds = 15) {
  // frequencyMap: { number: lastAppearedRound }
  if (!frequencyMap || Object.keys(frequencyMap).length === 0) {
    // 기본값: 무작위 콜드넘버 시뮬레이션
    return [7, 13, 28, 39, 42];
  }
  
  const cold = Object.entries(frequencyMap)
    .filter(([_, lastRound]) => lastRound >= recentRounds)
    .sort((a, b) => b[1] - a[1])
    .map(([num]) => parseInt(num));
  
  return cold.slice(0, 5);
}

// [10] 대각선(X자) 및 모서리 방어
export function getDiagonalCornerCandidates(selected) {
  // OMR 7x7 그리드 모서리 번호
  const corners = [1, 7, 36, 42, 43, 45];
  // 주대각선 (좌상→우하)
  const mainDiag = [1, 9, 17, 25, 33, 41];
  // 역대각선 (우상→좌하)
  const antiDiag = [7, 13, 19, 25, 31, 37, 43];
  
  const all = [...new Set([...corners, ...mainDiag, ...antiDiag])].filter(n => n <= 45);
  const notSelected = all.filter(n => !selected.includes(n));
  return notSelected;
}

// [11] 가로/세로 띠 멸종 방지
export function analyzeLineBalance(selected) {
  const rows = new Array(7).fill(0);
  const cols = new Array(7).fill(0);
  
  selected.forEach(n => {
    const { row, col } = numToGrid(n);
    rows[row]++;
    cols[col]++;
  });
  
  const emptyRows = rows.reduce((acc, v, i) => v === 0 && i * 7 + 1 <= 45 ? [...acc, i] : acc, []);
  const overloadedRows = rows.reduce((acc, v, i) => v >= 3 ? [...acc, i] : acc, []);
  
  return { rows, cols, emptyRows, overloadedRows };
}

export function getLineBalanceCandidates(selected) {
  const { emptyRows } = analyzeLineBalance(selected);
  const candidates = [];
  emptyRows.forEach(row => {
    for (let col = 0; col < 7; col++) {
      const num = gridToNum(row, col);
      if (num && !selected.includes(num)) candidates.push(num);
    }
  });
  return candidates;
}

// [12] 동형수 (거울수)
export function getMirrorCandidates(selected) {
  const mirrorPairs = [
    [12, 21], [13, 31], [14, 41], [23, 32], [24, 42], [34, 43]
  ];
  
  const candidates = [];
  selected.forEach(n => {
    mirrorPairs.forEach(([a, b]) => {
      if (n === a && !selected.includes(b) && b <= 45) candidates.push(b);
      if (n === b && !selected.includes(a) && a <= 45) candidates.push(a);
    });
  });
  return [...new Set(candidates)];
}

// [13] 퐁당퐁당 (징검다리)
export function getSteppingCandidates(selected) {
  const candidates = new Set();
  selected.forEach(n => {
    const { row, col } = numToGrid(n);
    // OMR 그리드에서 한 칸 건너뛴 위치
    const jumps = [
      gridToNum(row, col + 2),
      gridToNum(row, col - 2),
      gridToNum(row + 2, col),
      gridToNum(row - 2, col),
    ];
    jumps.forEach(j => {
      if (j && !selected.includes(j)) candidates.add(j);
    });
  });
  return [...candidates];
}

// [14] 십자(Cross) 포위
export function getCrossCandidates(selected) {
  const candidates = new Set();
  selected.forEach(n => {
    const { row, col } = numToGrid(n);
    const neighbors = [
      gridToNum(row - 1, col), // 상
      gridToNum(row + 1, col), // 하
      gridToNum(row, col - 1), // 좌
      gridToNum(row, col + 1), // 우
    ];
    neighbors.forEach(nb => {
      if (nb && !selected.includes(nb)) candidates.add(nb);
    });
  });
  return [...candidates];
}

// [15] 역대 궁합수 매칭 (동반 출현 빈도)
export function getCooccurrenceCandidates(selected, cooccurrenceMatrix) {
  if (!cooccurrenceMatrix || Object.keys(cooccurrenceMatrix).length === 0) {
    // 기본 궁합 데이터 (역대 통계 기반 상위 매칭)
    const defaultPairs = {
      1: [40, 33], 2: [37, 18], 3: [27, 35], 4: [39, 12], 5: [24, 33],
      6: [14, 45], 7: [34, 12], 8: [25, 40], 9: [20, 37], 10: [33, 44],
      11: [27, 39], 12: [7, 4], 13: [25, 40], 14: [6, 34], 15: [28, 43],
      16: [24, 37], 17: [34, 40], 18: [2, 24], 19: [33, 43], 20: [9, 33],
      21: [34, 35], 22: [33, 39], 23: [29, 43], 24: [5, 16], 25: [8, 13],
      26: [34, 45], 27: [3, 11], 28: [15, 40], 29: [23, 43], 30: [34, 42],
      31: [38, 40], 32: [38, 45], 33: [1, 10], 34: [7, 14], 35: [3, 21],
      36: [42, 45], 37: [2, 9], 38: [31, 32], 39: [4, 11], 40: [1, 8],
      41: [43, 44], 42: [30, 36], 43: [15, 23], 44: [10, 41], 45: [6, 26],
    };
    const candidates = new Set();
    selected.forEach(n => {
      const pairs = defaultPairs[n];
      if (pairs) pairs.forEach(p => { if (!selected.includes(p)) candidates.add(p); });
    });
    return [...candidates];
  }
  
  const candidates = new Set();
  selected.forEach(n => {
    const pairs = cooccurrenceMatrix[n];
    if (pairs) {
      const sorted = Object.entries(pairs).sort((a, b) => b[1] - a[1]);
      sorted.slice(0, 3).forEach(([num]) => {
        const p = parseInt(num);
        if (!selected.includes(p)) candidates.add(p);
      });
    }
  });
  return [...candidates];
}

// [16] 쌍둥이 수 방어
export function analyzeTwinNumbers(selected) {
  const twins = [11, 22, 33, 44];
  const twinCount = selected.filter(n => twins.includes(n)).length;
  return {
    twinCount,
    warning: twinCount > 1,
    twins: selected.filter(n => twins.includes(n)),
  };
}

// [17] 무게중심 (고저/홀짝)
export function analyzeBalance(selected) {
  if (selected.length === 0) return { oddEven: [0, 0], highLow: [0, 0], sum: 0, balanced: true };
  
  const odd = selected.filter(n => n % 2 === 1).length;
  const even = selected.filter(n => n % 2 === 0).length;
  const low = selected.filter(n => n <= 22).length;
  const high = selected.filter(n => n >= 23).length;
  const sum = selected.reduce((a, b) => a + b, 0);
  
  const oddEvenOk = selected.length < 6 || (odd >= 2 && odd <= 4);
  const highLowOk = selected.length < 6 || (low >= 2 && low <= 4);
  const sumOk = selected.length < 6 || (sum >= 100 && sum <= 180);
  
  return {
    oddEven: [odd, even],
    highLow: [low, high],
    sum,
    balanced: oddEvenOk && highLowOk && sumOk,
    warnings: [
      !oddEvenOk ? `홀짝이 ${odd}:${even}로 한쪽에 치우쳤어요` : null,
      !highLowOk ? `작은 수와 큰 수가 ${low}:${high}로 한쪽에 몰렸어요` : null,
      !sumOk ? `합계 ${sum}은 ${sum < 100 ? '조금 낮은' : '조금 높은'} 편이에요` : null,
    ].filter(Boolean),
  };
}

// ============================================================
// 복합 추천 엔진 (17종 필터 가중 결합)
// ============================================================

export function generateRecommendation({
  selected = [],
  enabledPatterns = {},
  weights = {},
  prevWinning = [],
  roundNumber = 1124,
  drawDate = new Date(),
  frequencyMap = {},
  cooccurrenceMatrix = {},
  count = 6,
}) {
  const needed = count - selected.length;
  if (needed <= 0) return [...selected].sort((a, b) => a - b);
  
  // 모든 후보 번호에 점수 부여
  const scores = {};
  for (let i = 1; i <= 45; i++) {
    if (!selected.includes(i)) scores[i] = 0;
  }
  
  const patternFunctions = {
    threeZone: () => getThreeZoneCandidates(selected),
    sandwich: () => getSandwichCandidates(selected),
    vertexCarryover: () => getVertexCarryoverCandidates(prevWinning),
    roundNumber: () => getRoundNumberCandidates(roundNumber),
    datePattern: () => getDatePatternCandidates(drawDate),
    holiday: () => getHolidayCandidates(drawDate),
    neighbor: () => getNeighborCandidates(prevWinning),
    sameEnding: () => getSameEndingCandidates(selected),
    coldRebound: () => getColdNumberCandidates(frequencyMap),
    diagonalCorner: () => getDiagonalCornerCandidates(selected),
    lineBalance: () => getLineBalanceCandidates(selected),
    mirror: () => getMirrorCandidates(selected),
    stepping: () => getSteppingCandidates(selected),
    cross: () => getCrossCandidates(selected),
    cooccurrence: () => getCooccurrenceCandidates(selected, cooccurrenceMatrix),
    twin: () => [], // 방어 패턴이므로 추천이 아닌 제외 로직
    balance: () => [], // 검증 패턴
  };
  
  // 활성화된 패턴별로 후보에 가중점수 부여
  Object.entries(patternFunctions).forEach(([id, fn]) => {
    if (enabledPatterns[id] === false) return;
    const weight = (weights[id] || 100) / 100;
    try {
      const candidates = fn();
      candidates.forEach(num => {
        if (scores[num] !== undefined) {
          scores[num] += weight;
        }
      });
    } catch (e) {
      // 개별 패턴 오류 시 무시
    }
  });
  
  // 쌍둥이 수 방어 (감점)
  if (enabledPatterns.twin !== false) {
    const twins = [11, 22, 33, 44];
    const currentTwins = selected.filter(n => twins.includes(n)).length;
    if (currentTwins >= 1) {
      twins.forEach(t => {
        if (scores[t] !== undefined) scores[t] -= 3;
      });
    }
  }
  
  // 점수 순으로 정렬 + 약간의 랜덤성 부여
  const ranked = Object.entries(scores)
    .map(([num, score]) => ({ num: parseInt(num), score: score + Math.random() * 2.5 }))
    .sort((a, b) => b.score - a.score);
  
  // 상위 후보에서 필요한 만큼 선택
  let result = [...selected];
  for (const { num } of ranked) {
    if (result.length >= count) break;
    
    // 무게중심 체크
    if (enabledPatterns.balance !== false) {
      const testSet = [...result, num];
      const balance = analyzeBalance(testSet);
      // 한쪽이 5개 이상이면 6번째로 되돌릴 수 없으므로 도중에 막음
      if (Math.max(...balance.oddEven, ...balance.highLow) > 4) continue;
      // 남은 칸으로 합계 100~180을 맞출 수 있어야 함
      const r = count - testSet.length;
      if (balance.sum + r * (91 - r) / 2 < 100 || balance.sum + r * (r + 1) / 2 > 180) continue;
      if (testSet.length === 6 && !balance.balanced) continue;
    }
    
    result.push(num);
  }
  
  // 결과가 부족할 경우 랜덤 보충
  while (result.length < count) {
    const remaining = Array.from({ length: 45 }, (_, i) => i + 1).filter(n => !result.includes(n));
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    result.push(pick);
  }
  
  return result.sort((a, b) => a - b);
}

// ============================================================
// 실시간 말풍선 메시지 생성
// ============================================================

export function generateBubbleMessage(num, selected, prevWinning = [], cooccurrenceMatrix = {}) {
  const messages = [];
  
  // 궁합수 안내
  const cooCandidates = getCooccurrenceCandidates([num], cooccurrenceMatrix);
  if (cooCandidates.length > 0) {
    messages.push(`${num}번을 고르셨네요! 역대 ${num}번과 가장 찰떡궁합인 ${cooCandidates[0]}번은 어떠신가요? 💑`);
  }
  
  // 이빨 빠진 수 체크
  const sandwiches = getSandwichCandidates([...selected, num]);
  if (sandwiches.length > 0) {
    messages.push(`앗! ${sandwiches[0]}번이 이빨 빠진 자리에 딱 들어맞아요! 🥪`);
  }
  
  // 이웃수 체크
  if (prevWinning.includes(num - 1) || prevWinning.includes(num + 1)) {
    messages.push(`좋아요! ${num}번은 지난주 당첨 번호의 이웃수예요! 🌊`);
  }
  
  // 거울수 체크
  const mirrors = getMirrorCandidates([...selected, num]);
  if (mirrors.length > 0) {
    messages.push(`${num}번의 거울수 ${mirrors[0]}번도 고려해보세요! 🪞`);
  }
  
  // 무게중심 경고
  const balance = analyzeBalance([...selected, num]);
  if (balance.warnings.length > 0) {
    messages.push(`⚠️ ${balance.warnings[0]}`);
  }
  
  // 기본 메시지
  if (messages.length === 0) {
    const defaults = [
      `${num}번 선택! 좋은 감이에요! ✨`,
      `${num}번! 오늘 기운이 좋은 번호네요! 🍀`,
      `${num}번 낙점! 멋진 선택이에요! 👍`,
    ];
    messages.push(defaults[num % defaults.length]);
  }
  
  return messages[0];
}
