import React from 'react'

export default function Toast({ message, onClose }) {
  return (
    <div className="toast" onClick={onClose} role="alert">
      {message}
    </div>
  )
}
