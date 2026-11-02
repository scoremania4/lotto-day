import React, { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import TabBar from './components/TabBar'
import Home from './pages/Home'
import NumberPicker from './pages/NumberPicker'
import WinCheck from './pages/WinCheck'
import Analysis from './pages/Analysis'
import NearbyStores from './pages/NearbyStores'
import Settings from './pages/Settings'
import Toast from './components/Toast'
import { getAccessibilitySettings, updateStreak } from './utils/storage'
import { startAutoUpdate } from './utils/autoUpdate'

function AppContent() {
  const [toast, setToast] = useState(null)
  const [dataVersion, setDataVersion] = useState(0) // 새 회차가 들어오면 화면을 다시 그림
  const location = useLocation()

  useEffect(() => {
    // 접근성 설정 적용
    const settings = getAccessibilitySettings()
    if (settings.fontSize !== 'normal') {
      document.documentElement.setAttribute('data-font-size', settings.fontSize)
    }
    if (settings.highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true')
    }
    // 접속 스트릭 업데이트
    updateStreak()
  }, [])

  const showToast = (message, duration = 3000) => {
    setToast(message)
    setTimeout(() => setToast(null), duration)
  }

  useEffect(() => startAutoUpdate(round => {
    setDataVersion(v => v + 1)
    showToast(`제 ${round}회 당첨 번호가 들어왔어요`)
  }), [])


  return (
    <>
      <Routes key={dataVersion}>
        <Route path="/" element={<Home showToast={showToast} />} />
        <Route path="/pick" element={<NumberPicker showToast={showToast} />} />
        <Route path="/analysis" element={<Analysis showToast={showToast} />} />
        <Route path="/check" element={<WinCheck showToast={showToast} />} />
        <Route path="/stores" element={<NearbyStores showToast={showToast} />} />
        <Route path="/settings" element={<Settings showToast={showToast} />} />
      </Routes>
      <TabBar />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
