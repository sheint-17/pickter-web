"use client"

import { Users, TrendingUp, Award, Zap } from "lucide-react"

const stats = [
  {
    label: "총 참여자",
    value: "1.2M",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "진행중 이슈",
    value: "342",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "오늘의 예측왕",
    value: "@kimtaehyung",
    icon: Award,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    label: "총 적중률",
    value: "67%",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
]

export function StatsBanner() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
