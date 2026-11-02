import React from 'react'
import { getBallRangeClass } from '../utils/helpers'

export default function LottoBall({ number, size = 'md', bonus = false, dim = false, ring = false }) {
  const cls = ['lotto-ball', getBallRangeClass(number)]
  if (size !== 'md') cls.push(`size-${size}`)
  if (bonus) cls.push('bonus')
  if (dim) cls.push('dim')
  if (ring) cls.push('ring')
  return <span className={cls.join(' ')} aria-label={`${number}번${bonus ? ' 보너스' : ''}`}>{number}</span>
}
