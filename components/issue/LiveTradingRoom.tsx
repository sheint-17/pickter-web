'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

interface ChatMessage {
  id: string
  user_id: string
  nickname: string
  message: string
  position: 'yes' | 'no' | 'none'
  created_at: string
}

interface Props {
  issueId: string
  currentUserId: string | null
  currentNickname: string | null
  currentPosition: 'yes' | 'no' | 'none'
}

export default function LiveTradingRoom({
  issueId,
  currentUserId,
  currentNickname,
  currentPosition,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    supabase
      .from('issue_chats')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setMessages(data.reverse() as ChatMessage[])
          setTimeout(scrollToBottom, 50)
        }
      })

    const channel = supabase.channel(`issue_chat:${issueId}`, {
      config: { presence: { key: currentUserId ?? `anon_${Math.random()}` } },
    })

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'issue_chats', filter: `issue_id=eq.${issueId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage])
          setTimeout(scrollToBottom, 50)
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId ?? 'anon',
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [issueId, currentUserId, scrollToBottom])

  const send = async () => {
    const text = input.trim()
    if (!text || !currentUserId || !currentNickname || sending) return

    setSending(true)
    setInput('')

    await supabase.from('issue_chats').insert({
      issue_id: issueId,
      user_id: currentUserId,
      nickname: currentNickname,
      message: text,
      position: currentPosition,
    })

    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const badge = (pos: 'yes' | 'no' | 'none') => {
    if (pos === 'yes') return { label: '픽', color: Colors.yes }
    if (pos === 'no') return { label: '패스', color: Colors.no }
    return null
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
          라이브 트레이딩 룸
        </h2>
        {onlineCount > 0 && (
          <span style={{ fontSize: '12px', color: Colors.textTertiary, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              display: 'inline-block', width: '7px', height: '7px',
              borderRadius: '50%', background: '#22c55e',
            }} />
            {onlineCount}명 접속 중
          </span>
        )}
      </div>

      {/* 메시지 목록 */}
      <div style={{
        height: '320px',
        overflowY: 'auto',
        background: Colors.background,
        borderRadius: '12px',
        border: `1px solid ${Colors.border}`,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {messages.length === 0 && (
          <p style={{
            color: Colors.textTertiary, fontSize: '13px',
            textAlign: 'center', margin: 'auto',
          }}>
            아직 메시지가 없어요. 첫 번째로 의견을 남겨보세요!
          </p>
        )}

        {messages.map(msg => {
          const isMe = msg.user_id === currentUserId
          const b = badge(msg.position)
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                {b && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: b.color,
                    border: `1px solid ${b.color}`, borderRadius: '4px',
                    padding: '1px 5px', lineHeight: 1.4,
                  }}>
                    {b.label}
                  </span>
                )}
                <span style={{ fontSize: '11px', fontWeight: 600, color: Colors.textSecondary }}>
                  {isMe ? '나' : msg.nickname}
                </span>
              </div>
              <div style={{
                maxWidth: '75%',
                padding: '8px 12px',
                borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: isMe ? Colors.primary : Colors.white,
                color: isMe ? Colors.white : Colors.textPrimary,
                fontSize: '13px',
                lineHeight: '1.5',
                border: isMe ? 'none' : `1px solid ${Colors.border}`,
                wordBreak: 'break-word',
              }}>
                {msg.message}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      {currentUserId ? (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="의견을 입력하세요 (최대 200자)"
            maxLength={200}
            disabled={sending}
            style={{
              flex: 1, padding: '10px 14px',
              border: `1px solid ${Colors.border}`, borderRadius: '10px',
              fontSize: '14px', color: Colors.textPrimary,
              background: Colors.white, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              padding: '10px 18px',
              background: Colors.primary,
              color: Colors.white,
              border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700,
              cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
              opacity: !input.trim() || sending ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            전송
          </button>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: Colors.textTertiary, textAlign: 'center', marginTop: '12px' }}>
          로그인 후 채팅에 참여할 수 있어요
        </p>
      )}
    </div>
  )
}
