'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Banner {
  src: string
  href: string
  alt: string
}

const BANNERS: Banner[] = [
  { src: '/banners/banner_01.png', href: '/',        alt: '픽터 지적 계급 시스템' },
  { src: '/banners/banner_02.png', href: '/',        alt: '픽터 베타 오픈' },
  { src: '/banners/banner_03.png', href: '/ranking', alt: '픽터 랭킹 도전' },
]

interface Props {
  fillHeight?: boolean
}

export function PromoBanner({ fillHeight = false }: Props) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(prev => (prev + 1) % BANNERS.length)
        setVisible(true)
      }, 300)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const b = BANNERS[idx]

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: fillHeight ? '100%' : 'auto',
      minHeight: '90px',
      borderRadius: '14px',
      overflow: 'hidden',
      transition: 'opacity 0.3s ease',
      opacity: visible ? 1 : 0,
      cursor: 'pointer',
    }}>
      <Link href={b.href} style={{ display: 'block', width: '100%', height: '100%' }}>
        <Image
          src={b.src}
          alt={b.alt}
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
      </Link>

      {/* 도트 인디케이터 */}
      <div style={{
        position: 'absolute', bottom: '10px', right: '14px',
        display: 'flex', gap: '5px', zIndex: 2,
      }}>
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault()
              setVisible(false)
              setTimeout(() => { setIdx(i); setVisible(true) }, 300)
            }}
            style={{
              width: i === idx ? '16px' : '5px',
              height: '5px',
              borderRadius: '999px',
              border: 'none',
              padding: 0,
              background: i === idx ? 'white' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
