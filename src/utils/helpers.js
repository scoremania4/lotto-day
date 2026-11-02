/* ============================================================
   헬퍼 유틸리티
   ============================================================ */

// ── 다가오는 추첨일 계산 (매주 토요일) ──
export function getNextDrawDate() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=일 ~ 6=토
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  
  // 오늘이 토요일이고 20:45 이전이면 오늘
  if (dayOfWeek === 6 && now.getHours() < 21) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSaturday);
  return new Date(next.getFullYear(), next.getMonth(), next.getDate());
}

// ── 남은 시간 계산 ──
export function getTimeUntilDraw() {
  const drawDate = getNextDrawDate();
  drawDate.setHours(20, 35, 0, 0);
  const now = new Date();
  const diff = drawDate - now;
  
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, expired: false };
}

// ── 다가오는 추첨 회차 (1회차 2002-12-07부터 매주) ──
export function estimateCurrentRound() {
  const firstDraw = new Date(2002, 11, 7);
  return Math.round((getNextDrawDate() - firstDraw) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

// ── 날짜 포맷팅 ──
export function formatDate(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[d.getDay()];
  return `${month}월 ${day}일 (${dayName})`;
}

// ── 금액 포맷팅 ──
export function formatMoney(amount) {
  if (amount >= 100000000) {
    return `${Math.floor(amount / 100000000)}억 ${Math.floor((amount % 100000000) / 10000)}만원`;
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

// ── 공 색상 범위 ──
export function getBallRangeClass(num) {
  if (num <= 10) return 'range-1';
  if (num <= 20) return 'range-2';
  if (num <= 30) return 'range-3';
  if (num <= 40) return 'range-4';
  return 'range-5';
}

// ── 용지 이미지 캡처 (Canvas) ──
export async function captureOMRToImage(numbers, roundNumber) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // 배경
  ctx.fillStyle = '#1a1a3e';
  ctx.fillRect(0, 0, 600, 400);
  
  // 타이틀
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍀 로또 당첨되는 날', 300, 40);
  
  ctx.fillStyle = '#b0b0d0';
  ctx.font = '16px "Noto Sans KR", sans-serif';
  ctx.fillText(`제 ${roundNumber}회 추천 번호`, 300, 70);
  
  // 번호 공 그리기
  const ballColors = {
    1: '#ffd700', 2: '#3498db', 3: '#e74c3c', 4: '#95a5a6', 5: '#2ecc71'
  };
  const sorted = [...numbers].sort((a, b) => a - b);
  
  sorted.forEach((num, i) => {
    const x = 80 + i * 80;
    const y = 150;
    const range = num <= 10 ? 1 : num <= 20 ? 2 : num <= 30 ? 3 : num <= 40 ? 4 : 5;
    
    // 공 그리기
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fillStyle = ballColors[range];
    ctx.fill();
    
    // 숫자
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), x, y);
  });
  
  // 하단 워터마크
  ctx.fillStyle = '#7070a0';
  ctx.font = '14px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('로또 당첨되는 날 앱에서 생성된 추천 번호입니다 🍀', 300, 350);
  
  return canvas.toDataURL('image/png');
}

// ── 공유하기 ──
export async function shareNumbers(numbers, roundNumber) {
  const text = `🍀 로또 당첨되는 날 - 제 ${roundNumber}회 추천 번호\n\n` +
    `[ ${numbers.join(', ')} ]\n\n` +
    `행운을 빕니다! 🎰`;
  
  if (navigator.share) {
    try {
      await navigator.share({ title: '로또 당첨되는 날', text });
      return true;
    } catch (e) {
      // 사용자가 취소
    }
  }
  
  // fallback: 클립보드 복사
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (e) {
    return false;
  }
}

// ── D-Day 텍스트 ──
export function getDDayText() {
  const { days, hours, minutes, expired } = getTimeUntilDraw();
  if (expired) return '추첨 진행중!';
  if (days === 0 && hours === 0) return `${minutes}분 후 추첨!`;
  if (days === 0) return `${hours}시간 ${minutes}분 후 추첨!`;
  return `D-${days}`;
}
