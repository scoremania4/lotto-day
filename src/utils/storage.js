/* ============================================================
   로컬 스토리지 관리 (IndexedDB / LocalStorage)
   오프라인에서도 동작하는 온디바이스 데이터 레이어
   ============================================================ */

const STORAGE_PREFIX = 'lotto_';

// ── LocalStorage 래퍼 ──
export function save(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

export function load(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function remove(key) {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

// ── 번호 보관함 ──
export function saveNumbers(roundNumber, numbers, isPurchased = false) {
  const history = load('numberHistory', []);
  history.unshift({
    id: Date.now(),
    roundNumber,
    numbers: [...numbers].sort((a, b) => a - b),
    isPurchased,
    createdAt: new Date().toISOString(),
    result: null, // 당첨 결과 (추후 자동 대조 시 업데이트)
  });
  // 최대 200건 유지
  if (history.length > 200) history.splice(200);
  save('numberHistory', history);
  return history;
}

export function getNumberHistory() {
  return load('numberHistory', []);
}

export function togglePurchased(id) {
  const history = load('numberHistory', []);
  const item = history.find(h => h.id === id);
  if (item) {
    item.isPurchased = !item.isPurchased;
    save('numberHistory', history);
  }
  return history;
}

export function deleteHistoryItem(id) {
  let history = load('numberHistory', []);
  history = history.filter(h => h.id !== id);
  save('numberHistory', history);
  return history;
}

// ── 자동 당첨 대조 ──
export function checkHistoryAgainstWinning(winningNumbers, bonusNumber) {
  const history = load('numberHistory', []);
  let updated = false;
  
  history.forEach(item => {
    if (item.result) return; // 이미 확인됨
    
    const matched = item.numbers.filter(n => winningNumbers.includes(n));
    const bonusMatch = item.numbers.includes(bonusNumber);
    
    let rank = null;
    if (matched.length === 6) rank = 1;
    else if (matched.length === 5 && bonusMatch) rank = 2;
    else if (matched.length === 5) rank = 3;
    else if (matched.length === 4) rank = 4;
    else if (matched.length === 3) rank = 5;
    
    item.result = {
      matchedNumbers: matched,
      bonusMatch,
      rank,
      checkedAt: new Date().toISOString(),
    };
    updated = true;
  });
  
  if (updated) save('numberHistory', history);
  return history;
}

// ── 단골 번호(My 고정수) ──
export function getFixedNumbers() {
  return load('fixedNumbers', []);
}

export function setFixedNumbers(numbers) {
  save('fixedNumbers', numbers.slice(0, 3)); // 최대 3개
}

// ── 패턴 필터 설정 ──
export function getEnabledPatterns() {
  return load('enabledPatterns', {});
}

export function setEnabledPatterns(patterns) {
  save('enabledPatterns', patterns);
}

// ── 알고리즘 가중치 ──
export function getWeights() {
  return load('weights', {});
}

export function setWeights(weights) {
  save('weights', weights);
}

// ── 접근성 설정 ──
export function getAccessibilitySettings() {
  return load('accessibility', {
    fontSize: 'normal', // 'normal' | 'large' | 'xlarge'
    highContrast: false,
  });
}

export function setAccessibilitySettings(settings) {
  save('accessibility', settings);
}

// ── 접속 스트릭 ──
export function updateStreak() {
  const streak = load('streak', { count: 0, lastDate: null });
  const today = new Date().toISOString().slice(0, 10);
  
  if (streak.lastDate === today) {
    return streak; // 이미 오늘 접속
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  if (streak.lastDate === yesterdayStr) {
    streak.count += 1;
  } else {
    streak.count = 1;
  }
  streak.lastDate = today;
  save('streak', streak);
  return streak;
}

export function getStreak() {
  return load('streak', { count: 0, lastDate: null });
}

// ── 통계 리포트 ──
export function getStats() {
  const history = getNumberHistory();
  const total = history.length;
  const purchased = history.filter(h => h.isPurchased).length;
  const checked = history.filter(h => h.result).length;
  
  const wins = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  history.forEach(h => {
    if (h.result?.rank) wins[h.result.rank]++;
  });
  
  return { total, purchased, checked, wins };
}
