import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon'

const tabs = [
  { path: '/', label: '홈', icon: 'home' },
  { path: '/pick', label: '번호 뽑기', icon: 'clover' },
  { path: '/analysis', label: '패턴 분석', icon: 'chart' },
  { path: '/check', label: '당첨 확인', icon: 'ticket' },
  { path: '/stores', label: '명당', icon: 'pin' },
]

export default function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="tab-bar" aria-label="메인 탭">
      {tabs.map(tab => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            className={`tab-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-icon"><Icon name={tab.icon} size={26} strokeWidth={active ? 2 : 1.7} /></span>
            <span className="tab-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
