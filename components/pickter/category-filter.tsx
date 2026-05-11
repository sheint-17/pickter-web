"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Flame } from "lucide-react"
import Link from "next/link"

const categories = [
  { id: "hot", label: "인기", icon: Flame },
  { id: "all", label: "전체", icon: null },
  { id: "politics", label: "정치", icon: null },
  { id: "economy", label: "경제", icon: null },
  { id: "entertainment", label: "엔터", icon: null },
  { id: "sports", label: "스포츠", icon: null },
  { id: "tech", label: "IT", icon: null },
  { id: "society", label: "사회", icon: null },
  { id: "other", label: "기타", icon: null },
]

const moreMenuItems = [
  { emoji: "🏠", label: "홈", href: "/" },
  { emoji: "🏆", label: "랭킹", href: "/ranking" },
  { emoji: "🎯", label: "출석", href: "/attendance" },
  { emoji: "🤖", label: "AI 대결", href: "/ai-challenge" },
  { emoji: "👤", label: "마이페이지", href: "/mypage" },
]

interface CategoryFilterProps {
  onCategoryChange?: (category: string) => void
}

export function CategoryFilter({ onCategoryChange }: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState("hot")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    onCategoryChange?.(categoryId)
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto" }}>
      {categories.map((category) => {
        const isActive = activeCategory === category.id
        const Icon = category.icon

        return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground hover:bg-secondary border border-border"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {category.label}
          </button>
        )
      })}

      {/* 더보기 드롭다운 */}
      <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-card text-muted-foreground hover:bg-secondary border border-border"
        >
          더보기 {dropdownOpen ? "▲" : "▼"}
        </button>

        {dropdownOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 100,
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "8px",
            minWidth: "160px",
          }}>
            {moreMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDropdownOpen(false)}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 16px",
                    fontSize: "14px",
                    color: "#1A1A1A",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F4F4F5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
