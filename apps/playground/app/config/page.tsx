'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Key, Shield, RefreshCcw, Copy, Check, Trash2, BarChart3, Clock, AlertTriangle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { saveApiKey, clearApiKey, getApiKey, maskApiKey } from '@/lib/auth'

// Use environment variable with fallback - works in both dev and production
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001'

interface Stats {
  usageToday: number
  plan: string
}

export default function ConfigPage() {
  const [email, setEmail] = useState('')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Hydrate auth state on mount
  useEffect(() => {
    const stored = getApiKey()
    if (stored) {
      setApiKey(stored)
      fetchStats(stored)
    }
  }, [])

  const fetchStats = useCallback(async (key: string) => {
    try {
      const res = await fetch(`${GATEWAY_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${key}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats({ usageToday: data.usageToday ?? 0, plan: data.plan ?? 'Free' })
      }
    } catch (e) {
      // non-fatal — stats are optional
    }
  }, [])

  const handleRegister = async () => {
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${GATEWAY_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.apiKey) {
        saveApiKey(data.apiKey)
        setApiKey(data.apiKey)
        fetchStats(data.apiKey)
        toast.success('API key generated and saved! You can now use the Tools page.')
      } else {
        toast.error(data.error ?? 'Registration failed. Please try again.')
      }
    } catch {
      toast.error('Registration failed. Is the gateway running?')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('API key copied to clipboard')
  }

  const handleClear = () => {
    clearApiKey()
    setApiKey(null)
    setStats(null)
    toast.success('API key removed from browser storage')
  }

  const masked = maskApiKey(apiKey ?? '')

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your API key, monitor usage, and check your quota.
        </p>
      </div>

      {!apiKey ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-card p-8 text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-semibold">Get Started with India-MCP</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email to create a free account. Your API key will be saved automatically — no manual steps needed.
            </p>
          </div>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="name@company.com"
              className="flex-1 h-10 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRegister() }}
            />
            <button
              onClick={handleRegister}
              disabled={loading || !email.trim()}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading
                ? <RefreshCcw className="w-4 h-4 animate-spin" />
                : 'Register'}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {/* API Key Card */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                API Key
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium uppercase tracking-wider">
                  Active
                </span>
              </div>
            </div>

            {/* Masked key + actions */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <code className="flex-1 font-mono text-sm text-muted-foreground break-all">
                {masked ?? '••••••••••••••••'}
              </code>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleCopy}
                  title="Copy full key"
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  {copied
                    ? <Check className="w-4 h-4 text-green-500" />
                    : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleClear}
                  title="Remove key from browser"
                  className="p-2 rounded-lg bg-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              <span>Your key is stored locally in this browser. It persists across refreshes.</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => { setApiKey(null); setEmail(''); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
                Register a different email
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4" /> Usage Today
              </div>
              <div className="text-3xl font-bold">{stats?.usageToday ?? '—'} / 100</div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(stats?.usageToday ?? 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" /> Current Plan
              </div>
              <div className="text-3xl font-bold capitalize">{stats?.plan ?? 'Free'}</div>
              <button className="text-xs text-primary font-medium hover:underline">Upgrade to Pro →</button>
            </div>

            <div className="rounded-xl border bg-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" /> Reset In
              </div>
              <div className="text-3xl font-bold">14h 22m</div>
              <p className="text-xs text-muted-foreground">Resets at midnight UTC</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
