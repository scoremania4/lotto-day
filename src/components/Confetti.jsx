import React, { useEffect, useState } from 'react'

const COLORS = ['#F0B23C', '#4A7FC1', '#D75A4A', '#5E9E68', '#D2553A', '#E8C9A0']

function ConfettiPiece({ delay, left }) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const size = 6 + Math.random() * 8
  const rotation = Math.random() * 360
  const duration = 2 + Math.random() * 2

  return (
    <div
      className="confetti-piece"
      style={{
        left: `${left}%`,
        top: '-10px',
        width: `${size}px`,
        height: `${size * 0.6}px`,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        transform: `rotate(${rotation}deg)`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  )
}

export default function Confetti({ show, duration = 4000 }) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!visible) return null

  const pieces = Array.from({ length: 60 }, (_, i) => (
    <ConfettiPiece
      key={i}
      delay={Math.random() * 1.5}
      left={Math.random() * 100}
    />
  ))

  return <div className="confetti-container">{pieces}</div>
}
