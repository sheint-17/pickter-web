"use client"

import { TrendingUp, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendingItem {
  id: string
  title: string
  pickPercent: number
  change: number
  category: string
}

const trendingItems: TrendingItem[] = [
  {
    id: "1",
    title: "아이브 컴백 앨범, 초동 100만장 돌파할까?",
    pickPercent: 70,
    change: 12,
    category: "엔터",
  },
  {
    id: "2",
    title: "손흥민, 2026 월드컵 출전할까?",
    pickPercent: 65,
    change: 8,
    category: "스포츠",
  },
  {
    id: "3",
    title: "애플 WWDC 2026에서 AI 기능 대거 공개될까?",
    pickPercent: 78,
    change: 15,
    category: "IT",
  },
  {
    id: "4",
    title: "비트코인 연내 10만 달러 돌파할까?",
    pickPercent: 45,
    change: -5,
    category: "경제",
  },
  {
    id: "5",
    title: "2026 총선 여당 과반 의석 확보할까?",
    pickPercent: 42,
    change: 3,
    category: "정치",
  },
]

const topicItems = [
  { id: "1", name: "K-POP", count: 234 },
  { id: "2", name: "월드컵", count: 189 },
  { id: "3", name: "WWDC", count: 156 },
  { id: "4", name: "금리인상", count: 134 },
  { id: "5", name: "대선", count: 98 },
]

export function TrendingSidebar() {
  return (
    <aside className="space-y-6">
      {/* Trending Issues */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            급상승 이슈
          </h3>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            더보기
          </button>
        </div>
        <div className="space-y-3">
          {trendingItems.map((item, index) => (
            <div
              key={item.id}
              className="group flex items-start gap-3 p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-primary font-semibold">
                    픽 {item.pickPercent}%
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      item.change > 0 ? "text-emerald-500" : "text-destructive"
                    )}
                  >
                    {item.change > 0 ? "+" : ""}
                    {item.change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Topics */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">인기 토픽</h3>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            더보기
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {topicItems.map((topic) => (
            <button
              key={topic.id}
              className="px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              #{topic.name}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            마감 임박
          </h3>
        </div>
        <div className="space-y-3">
          {[
            { title: "애플 WWDC 2026 AI 기능 공개?", hours: 2 },
            { title: "아이브 컴백 초동 100만장?", hours: 12 },
            { title: "비트코인 10만 달러?", hours: 24 },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            >
              <p className="text-sm text-foreground truncate flex-1 mr-2">
                {item.title}
              </p>
              <span className="text-xs text-orange-500 font-medium whitespace-nowrap">
                {item.hours}시간 남음
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
