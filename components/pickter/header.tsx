"use client"

import { Bell, Search, Wallet, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="grid grid-cols-3 gap-0.5">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i < 6 ? "bg-primary" : "bg-primary/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xl font-bold">
              <span className="text-primary">PICK</span>
              <span className="text-emerald-500">TER</span>
            </span>
          </div>

          {/* Search */}
          <div className="hidden flex-1 max-w-xl md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="이슈 검색..."
                className="w-full pl-10 bg-secondary border-0"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
              <Wallet className="h-4 w-4" />
              <span>1,250 P</span>
            </Button>
            <Link href="/mypage">
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
