'use client'

import { createContext, useContext, useState } from 'react'
import { AuthModal } from './AuthModal'

interface AuthModalContextType {
  openLogin: () => void
  openSignup: () => void
}

const AuthModalContext = createContext<AuthModalContextType>({
  openLogin: () => {},
  openSignup: () => {},
})

export function useAuthModal() {
  return useContext(AuthModalContext)
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const openLogin = () => { setMode('login'); setIsOpen(true) }
  const openSignup = () => { setMode('signup'); setIsOpen(true) }

  return (
    <AuthModalContext.Provider value={{ openLogin, openSignup }}>
      {children}
      <AuthModal
        isOpen={isOpen}
        mode={mode}
        onClose={() => setIsOpen(false)}
        onModeChange={setMode}
      />
    </AuthModalContext.Provider>
  )
}
