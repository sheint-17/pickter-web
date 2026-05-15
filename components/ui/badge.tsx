import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Colors } from "@/constants/colors"
import type { UserTier, IssueCategory } from "@/types"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

const categoryLabel: Record<IssueCategory, string> = {
  politics: "정치",
  economy: "경제",
  entertainment: "엔터",
  sports: "스포츠",
  tech: "IT",
  social: "사회",
  etc: "기타",
}

const TIER_COLORS: Record<UserTier, string> = {
  Unranked: '#AAAAAA',
  Bronze: '#A0622A',
  Silver: '#666666',
  Gold: '#B8860B',
  Platinum: '#0A8F96',
  Diamond: '#1272A0',
  Grandmaster: '#5A1FAA',
}

function TierIcon({ tier, size = 28 }: { tier: UserTier; size?: number }) {
  const s = size
  switch (tier) {
    case 'Unranked':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="#F0F0F0" stroke="#CCCCCC" strokeWidth="2.5"/>
          <circle cx="40" cy="40" r="26" fill="none" stroke="#DDDDDD" strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x="40" y="46" textAnchor="middle" fontSize="24" fontWeight="700" fill="#AAAAAA" fontFamily="sans-serif">?</text>
        </svg>
      )
    case 'Bronze':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="#FDF0E6" stroke="#CD7F32" strokeWidth="2.5"/>
          <circle cx="40" cy="40" r="29" fill="none" stroke="#CD7F32" strokeWidth="1" opacity="0.25"/>
          <ellipse cx="40" cy="44" rx="11" ry="14" fill="#CD7F32" opacity="0.9"/>
          <ellipse cx="40" cy="44" rx="11" ry="14" fill="none" stroke="#A0622A" strokeWidth="1"/>
          <path d="M40 32 C40 32 40 56 40 56" stroke="#A0622A" strokeWidth="1.2" opacity="0.4"/>
          <path d="M32 40 C34 36 46 36 48 40" stroke="#A0622A" strokeWidth="1" opacity="0.3"/>
          <path d="M40 30 C40 30 40 22 40 22" stroke="#CD7F32" strokeWidth="2" strokeLinecap="round"/>
          <path d="M40 26 C40 26 35 22 33 18" stroke="#CD7F32" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M40 24 C40 24 45 20 47 16" stroke="#CD7F32" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    case 'Silver':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
          <path d="M40 6 L66 18 L66 42 C66 58 40 74 40 74 C40 74 14 58 14 42 L14 18 Z" fill="#F0F0F0" stroke="#888" strokeWidth="3"/>
          <path d="M40 12 L62 22 L62 42 C62 56 40 70 40 70 C40 70 18 56 18 42 L18 22 Z" fill="none" stroke="#AAAAAA" strokeWidth="1.5"/>
          <polygon points="40,20 42,31 50,27 44,35 54,37 44,39 50,47 42,43 40,54 38,43 30,47 36,39 26,37 36,35 30,27 38,31" fill="#666666" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="40" cy="37" r="5" fill="#666" stroke="white" strokeWidth="1.5"/>
          <circle cx="40" cy="37" r="3" fill="#00C4CC"/>
          <circle cx="40" cy="37" r="1.4" fill="white"/>
          <path d="M40 14 L41 18 L40 22 L39 18 Z" fill="#BBBBBB"/>
          <path d="M58 37 L54 38 L50 37 L54 36 Z" fill="#BBBBBB"/>
          <path d="M40 60 L41 56 L40 52 L39 56 Z" fill="#BBBBBB"/>
          <path d="M22 37 L26 38 L30 37 L26 36 Z" fill="#BBBBBB"/>
        </svg>
      )
    case 'Gold':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="#FFFBE0" stroke="#FFD700" strokeWidth="3"/>
          <circle cx="40" cy="40" r="29" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.4"/>
          <path d="M16,52 C14,46 15,38 20,34 C18,40 20,46 23,50 C20,51 18,52 16,52Z" fill="#FFD700" opacity="0.7"/>
          <path d="M18,44 C17,40 19,36 22,34 C20,38 21,42 23,46 C21,46 19,45 18,44Z" fill="#FFD700" opacity="0.5"/>
          <path d="M21,40 C20,36 22,32 26,30 C24,34 24,38 27,42 C24,42 22,41 21,40Z" fill="#FFD700" opacity="0.6"/>
          <path d="M64,52 C66,46 65,38 60,34 C62,40 60,46 57,50 C60,51 62,52 64,52Z" fill="#FFD700" opacity="0.7"/>
          <path d="M62,44 C63,40 61,36 58,34 C60,38 59,42 57,46 C59,46 61,45 62,44Z" fill="#FFD700" opacity="0.5"/>
          <path d="M59,40 C60,36 58,32 54,30 C56,34 56,38 53,42 C56,42 58,41 59,40Z" fill="#FFD700" opacity="0.6"/>
          <path d="M30,56 C33,59 37,60 40,60 C43,60 47,59 50,56 L48,54 C45,57 43,58 40,58 C37,58 35,57 32,54 Z" fill="#FFD700"/>
          <polygon points="40,22 43,32 54,32 46,38 49,49 40,43 31,49 34,38 26,32 37,32" fill="#FFD700" stroke="#DAA520" strokeWidth="1"/>
          <polygon points="40,25 42.5,32 51,32 45,37 47,46 40,41 33,46 35,37 29,32 37.5,32" fill="#FFE55C"/>
          <circle cx="40" cy="35" r="3" fill="white" opacity="0.25"/>
        </svg>
      )
    case 'Platinum':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="#E0FAFB" stroke="#00C4CC" strokeWidth="3"/>
          <circle cx="40" cy="40" r="29" fill="none" stroke="#00C4CC" strokeWidth="1" opacity="0.3"/>
          <path d="M12,40 C18,24 62,24 68,40 C62,56 18,56 12,40 Z" fill="none" stroke="#00C4CC" strokeWidth="2.5"/>
          <circle cx="40" cy="40" r="11" fill="#00C4CC"/>
          <circle cx="40" cy="40" r="7" fill="#E0FAFB"/>
          <circle cx="40" cy="40" r="4" fill="#00C4CC"/>
          <circle cx="42" cy="38" r="1.8" fill="white" opacity="0.7"/>
          <path d="M13,30 L14.5,26 L16,30 L20,31.5 L16,33 L14.5,37 L13,33 L9,31.5 Z" fill="#00C4CC" opacity="0.7"/>
          <path d="M64,30 L65.5,26 L67,30 L71,31.5 L67,33 L65.5,37 L64,33 L60,31.5 Z" fill="#00C4CC" opacity="0.7"/>
        </svg>
      )
    case 'Diamond':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
          <rect x="8" y="8" width="56" height="56" rx="12" fill="#E3F4FD" stroke="#4FC3F7" strokeWidth="2.5" transform="rotate(45 40 40)"/>
          <polygon points="40,14 56,28 40,58 24,28" fill="#4FC3F7" opacity="0.9"/>
          <polygon points="40,14 56,28 40,36" fill="white" opacity="0.35"/>
          <polygon points="40,14 24,28 40,36" fill="white" opacity="0.15"/>
          <line x1="24" y1="28" x2="56" y2="28" stroke="white" strokeWidth="1" opacity="0.5"/>
          <line x1="40" y1="14" x2="40" y2="58" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        </svg>
      )
    case 'Grandmaster':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
          <polygon points="40,4 68,20 68,52 40,68 12,52 12,20" fill="#F0E8FF" stroke="#7B2FBE" strokeWidth="2.5"/>
          <polygon points="40,10 62,23 62,49 40,62 18,49 18,23" fill="none" stroke="#7B2FBE" strokeWidth="1" opacity="0.3"/>
          <path d="M18,48 L18,34 L27,40 L40,20 L53,40 L62,34 L62,48 Z" fill="#7B2FBE"/>
          <rect x="16" y="48" width="48" height="7" rx="3.5" fill="#5A1FAA"/>
          <circle cx="40" cy="24" r="3.5" fill="#B08FE8"/>
          <circle cx="20" cy="37" r="3" fill="#B08FE8"/>
          <circle cx="60" cy="37" r="3" fill="#B08FE8"/>
        </svg>
      )
  }
}

function TierBadge({ tier, showIcon = false }: { tier: UserTier; showIcon?: boolean }) {
  if (showIcon) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <TierIcon tier={tier} size={64} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: TIER_COLORS[tier] }}>{tier}</span>
      </div>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '999px',
      background: Colors.tier[tier] + '20',
      fontSize: '12px', fontWeight: 700,
      color: TIER_COLORS[tier],
      border: `1px solid ${Colors.tier[tier]}60`,
    }}>
      <TierIcon tier={tier} size={14} />
      {tier}
    </span>
  )
}

function CategoryBadge({ category }: { category: IssueCategory }) {
  return (
    <span
      style={{
        background: Colors.primaryLight,
        color: Colors.primary,
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      {categoryLabel[category]}
    </span>
  )
}

export { Badge, badgeVariants, TierBadge, TierIcon, CategoryBadge }
