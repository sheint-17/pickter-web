// app/layout.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import GNB from '@/components/layout/GNB'
import CategoryBar from '@/components/layout/CategoryBar'
import { AuthModalProvider } from '@/components/layout/AuthModalProvider'
import { Geist } from "next/font/google"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'PICKTER — 세상보다 먼저 맞혀라',
  description: '세상보다 먼저 맞혀라. 무료 포인트 기반 집단지성 예측 플랫폼.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body style={{ margin: 0, padding: 0, background: '#F8F8F8', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <AuthModalProvider>
          <GNB />
          <div style={{
            position: 'fixed', top: '60px', left: 0, right: 0,
            zIndex: 90, background: 'white', borderBottom: '1px solid #F0F0F0',
          }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
              <Suspense fallback={<div style={{ height: '48px' }} />}>
                <CategoryBar />
              </Suspense>
            </div>
          </div>
          <main style={{
            width: '100%',
            paddingTop: '108px',
            paddingBottom: '40px',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}>
            {children}
          </main>
        </AuthModalProvider>
      </body>
    </html>
  )
}
