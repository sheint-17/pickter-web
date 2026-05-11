'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Colors } from '@/constants/colors'
import { markAsRead, markAllAsRead } from './actions'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  settlement: '📊',
  tier_up: '🏆',
  underdog: '🔥',
  attendance: '🎯',
  system: '📢',
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

export default function NotificationList({
  notifications,
  unreadCount,
}: {
  notifications: Notification[]
  unreadCount: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = (id: string, isRead: boolean) => {
    if (isRead) return
    startTransition(async () => {
      await markAsRead(id)
      router.refresh()
    })
  }

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllAsRead()
      router.refresh()
    })
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: Colors.textPrimary, margin: 0 }}>
          알림
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={isPending}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: Colors.primary, fontWeight: 600,
              opacity: isPending ? 0.5 : 1,
            }}
          >
            모두 읽음
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</p>
          <p style={{ fontSize: '14px', color: Colors.textTertiary }}>알림이 없어요</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n.id, n.is_read)}
            style={{
              background: n.is_read ? Colors.white : Colors.primaryLight,
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '8px',
              border: `1px solid ${n.is_read ? Colors.border : '#E0D0F8'}`,
              cursor: n.is_read ? 'default' : 'pointer',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              opacity: isPending ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {/* 아이콘 */}
            <span style={{
              fontSize: '22px', flexShrink: 0,
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: n.is_read ? Colors.background : 'rgba(123,47,190,0.08)',
              borderRadius: '50%',
            }}>
              {TYPE_ICON[n.type] ?? '📢'}
            </span>

            {/* 내용 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <p style={{
                  fontSize: '14px', fontWeight: n.is_read ? 500 : 700,
                  color: Colors.textPrimary, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {n.title}
                </p>
                {!n.is_read && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: Colors.primary, flexShrink: 0,
                  }} />
                )}
              </div>
              {n.body && (
                <p style={{
                  fontSize: '13px', color: Colors.textSecondary,
                  margin: '3px 0 0', lineHeight: 1.4,
                }}>
                  {n.body}
                </p>
              )}
              <p style={{
                fontSize: '11px', color: Colors.textTertiary,
                margin: '5px 0 0',
              }}>
                {formatRelativeTime(n.created_at)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
