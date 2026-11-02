import React, { useState, useEffect, useMemo } from 'react'
import Icon from '../components/Icon'
import BASE from '../data/stores.json'
import { ALL_DRAWS } from '../data/lottoHistory'
import { storesPath, toStore } from '../data/dhApi'
import { formatDate } from '../utils/helpers'
import { dhUrl, dhInit } from '../utils/net'
import { load, save } from '../utils/storage'

const naverSearch = (q, pos) => {
  const base = `https://map.naver.com/p/search/${encodeURIComponent(q)}`
  return pos ? `${base}?c=${pos.lng},${pos.lat},15,0,0,0,dh` : base
}

// 두 좌표 사이 거리(km)
function distanceKm(a, b) {
  const R = 6371, rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// 최신 회차 판매점: 빌드 때 받은 파일 → 기기 캐시 → 서버 순으로 확인
function useStores(round) {
  const cached = BASE.round === round ? BASE.list : load(`stores_${round}`)
  const [state, setState] = useState({ list: cached, round: cached ? round : BASE.round, loading: !cached })

  useEffect(() => {
    if (cached) return
    let alive = true
    const url = dhUrl(storesPath(round))
    // 웹 배포는 브라우저 제한으로 직접 못 부름 → 빌드 때 저장해 둔 판매점을 보여줌
    if (!url) { setState({ list: BASE.list, round: BASE.round, loading: false }); return () => {} }
    fetch(url, dhInit())
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(j => {
        const list = (j?.data?.list ?? []).map(toStore)
        if (!list.length) throw new Error('empty')
        save(`stores_${round}`, list)
        if (alive) setState({ list, round, loading: false })
      })
      .catch(() => alive && setState({ list: BASE.list, round: BASE.round, loading: false }))
    return () => { alive = false }
  }, [round])

  return state
}

export default function NearbyStores({ showToast }) {
  const latest = ALL_DRAWS.length
  const { list, round, loading } = useStores(latest)
  const draw = ALL_DRAWS[round - 1]
  const [rank, setRank] = useState(1)
  const [region, setRegion] = useState('전체')
  const [me, setMe] = useState(null)
  const [locating, setLocating] = useState(false)

  // 같은 가게의 여러 게임은 한 줄로
  const stores = useMemo(() => {
    const map = new Map()
    for (const s of list || []) {
      if (s.rank !== rank) continue
      const key = `${s.name}|${s.addr}`
      const prev = map.get(key)
      if (prev) { prev.count++; if (!prev.modes.includes(s.mode)) prev.modes.push(s.mode) }
      else map.set(key, { ...s, count: 1, modes: [s.mode] })
    }
    return [...map.values()]
  }, [list, rank])

  const regions = useMemo(() => {
    const c = {}
    stores.forEach(s => { c[s.region] = (c[s.region] || 0) + 1 })
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([r]) => r)
  }, [stores])

  const shown = useMemo(() => {
    const f = stores.filter(s => region === '전체' || s.region === region)
    if (!me) return f
    return f
      .map(s => ({ ...s, km: s.lat ? distanceKm(me, { lat: s.lat, lng: s.lng }) : null }))
      .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))
  }, [stores, region, me])

  const count = (r) => (list || []).filter(s => s.rank === r).length

  const locate = (then) => {
    if (!navigator.geolocation) return then(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocating(false); then({ lat: coords.latitude, lng: coords.longitude }) },
      () => { setLocating(false); showToast('위치를 알 수 없어요. 위치 권한을 확인해 주세요'); then(null) },
      { timeout: 10000 }
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">이번 주 행운이 머문 곳</div>
          <h1 className="page-title">명당 찾기</h1>
        </div>
        <button className="icon-btn" onClick={() => locate(pos => window.open(naverSearch('로또 판매점', pos), '_blank', 'noopener'))} aria-label="내 주변 판매점 지도">
          <Icon name="map" />
        </button>
      </header>

      <section className="card" style={{ padding: 'var(--space-lg)' }}>
        <div className="eyebrow">제 {round}회 · {draw && formatDate(draw.date)}</div>
        <h2 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>당첨 판매점</h2>
        {round !== latest && !loading && (
          <p className="pattern-desc" style={{ marginBottom: 'var(--space-sm)' }}>제 {latest}회 판매점을 불러오지 못해 {round}회 기록을 보여드려요.</p>
        )}

        <div className="segmented" role="group" aria-label="등수">
          {[1, 2].map(r => (
            <button key={r} aria-pressed={rank === r} onClick={() => { setRank(r); setRegion('전체') }}>
              {r}등 <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>{count(r)}곳</span>
            </button>
          ))}
        </div>

        <div className="chip-scroll">
          {['전체', ...regions].map(r => (
            <button key={r} className={`chip ${region === r ? 'chip-accent' : ''}`} onClick={() => setRegion(r)} aria-pressed={region === r}>{r}</button>
          ))}
        </div>

        <button
          className={`btn btn-sm btn-full ${me ? 'btn-secondary' : 'btn-secondary'}`}
          style={{ margin: 'var(--space-sm) 0 var(--space-xs)' }}
          onClick={() => (me ? setMe(null) : locate(setMe))}
          disabled={locating}
        >
          <Icon name="locate" size={18} /> {locating ? '위치 확인 중…' : me ? '가까운 순 해제' : '내 위치에서 가까운 순'}
        </button>

        {loading ? (
          <div className="empty-state"><div className="empty-text" style={{ fontSize: 'var(--fs-sm)' }}>판매점을 불러오는 중…</div></div>
        ) : (
          <ul className="store-list">
            {shown.map(s => (
              <li key={`${s.name}|${s.addr}`}>
                <a href={naverSearch(`${s.name} ${s.addr}`)} target="_blank" rel="noopener noreferrer" className="store-item">
                  <span className="store-main">
                    <span className="store-name">
                      {s.name}
                      {s.count > 1 && <span className="chip chip-accent" style={{ padding: '0 8px' }}>{s.count}게임</span>}
                    </span>
                    <span className="store-addr">{s.addr}</span>
                  </span>
                  <span className="store-side">
                    {s.modes.map(m => <span key={m} className={`chip ${m === '자동' ? '' : 'chip-leaf'}`} style={{ padding: '1px 8px' }}>{m}</span>)}
                    {s.km != null && <span className="store-km">{s.km < 1 ? `${Math.round(s.km * 1000)}m` : `${s.km.toFixed(1)}km`}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="footnote">
        판매점을 누르면 지도에서 위치를 보여드려요.<br />
        당첨 판매점 정보는 동행복권 기준이에요.
      </p>
    </div>
  )
}
