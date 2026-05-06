'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Search,
  GitBranch,
  Settings,
  Activity,
  Wallet,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Servers', icon: LayoutDashboard },
  { href: '/tools', label: 'Tools', icon: Search },
  { href: '/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/config', label: 'Config', icon: Settings },
  { href: '/health', label: 'Health', icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-xl">🇮🇳</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">India-MCP</h1>
            <p className="text-xs text-muted-foreground">Playground</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-1 h-8 rounded-r-full bg-primary"
                />
              )}
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Activity className="w-3 h-3" />
            <span>System Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>API Health</span>
              <span className="text-green-500 font-medium">98.5%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Avg Latency</span>
              <span className="text-muted-foreground">124ms</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Cache Hit</span>
              <span className="text-muted-foreground">76%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}