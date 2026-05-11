"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Home, CalendarCheck, Swords, Trophy, User } from "lucide-react"

const navItems = [
  { id: "home", label: "홈", icon: Home },
  { id: "attendance", label: "출석", icon: CalendarCheck },
  { id: "battle", label: "AI대결", icon: Swords },
  { id: "ranking", label: "랭킹", icon: Trophy },
  { id: "my", label: "마이", icon: User },
]

export function BottomNav() {
  const [activeItem, setActiveItem] = useState("home")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-14 w-12 h-1 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
