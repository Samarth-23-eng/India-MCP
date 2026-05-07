"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { LayoutDashboard, Search, GitBranch, Settings, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { hasApiKey } from '@/lib/auth'

const navItems = [
  { href: '/', label: 'Servers', icon: LayoutDashboard },
  { href: '/tools', label: 'Tools', icon: Search },
  { href: '/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/config', label: 'Config', icon: Settings },
  { href: '/metrics', label: 'Observatory', icon: Activity, highlight: true },
]

interface HealthStatus {
  status: string
  uptime: number
  activeServers: number
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function Sidebar() {
  const pathname = usePathname()
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [connected, setConnected] = useState(false)
  const [authed, setAuthed] = useState(false)

  // Poll auth + health on mount and periodically
  useEffect(() => {
    setAuthed(hasApiKey())
    async function fetchHealth() {
      try {
        // Try the API proxy first, then direct
        let res = await fetch('/api/metrics-proxy', { signal: AbortSignal.timeout(3000) })
        if (!res.ok) throw new Error('proxy failed')
        const data = await res.json()
        setHealth({ status: 'ok', uptime: data.uptime ?? 0, activeServers: data.activeServers ?? 0 })
        setConnected(true)
      } catch {
        try {
          const res = await fetch('http://localhost:3001/health', { signal: AbortSignal.timeout(2000) })
          if (res.ok) {
            const data = await res.json()
            setHealth({ status: data.status, uptime: data.uptime, activeServers: data.activeServers })
            setConnected(true)
          }
        } catch {}
      }
    }
    fetchHealth()
    const interval = setInterval(() => {
      setAuthed(hasApiKey())
      fetchHealth()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-xl">🇮🇳</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">India-MCP</h1>
            <p className="text-xs text-muted-foreground">Playground</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : item.highlight
                    ? 'bg-gradient-to-r from-violet-500/5 to-indigo-500/5 text-violet-600 dark:text-violet-400 hover:bg-primary/5 hover:text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-[3px] h-6 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={cn('w-4 h-4', item.highlight && !isActive ? 'text-violet-500' : '')} />
              {item.label}
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold">Live</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* System status widget */}
      <div className="p-4 border-t space-y-3">
        {/* Auth badge */}
        <div className="rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 p-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'relative flex items-center justify-center',
            )}>
              <span className={cn(
                'w-2 h-2 rounded-full',
                authed ? 'bg-green-500' : 'bg-amber-500'
              )} />
              {authed && (
                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
              )}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {authed ? 'API Key saved' : 'No API Key'}
            </span>
          </div>
          {!authed && (
            <Link
              href="/config"
              className="mt-2 block w-full text-center text-xs py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
            >
              Generate in Config →
            </Link>
          )}
        </div>

        {/* Gateway status */}
        <div className="rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {connected
              ? <><span className="relative flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-green-500" /></span><span>Gateway healthy</span></>
              : <><span className="relative flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-amber-500" /></span><span>Checking…</span></>
            }
          </div>
          {health && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-mono font-medium">{formatUptime(health.uptime)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Servers</span>
                <span className="font-mono font-medium">{health.activeServers} running</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono font-medium text-muted-foreground">v1.0.16</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
