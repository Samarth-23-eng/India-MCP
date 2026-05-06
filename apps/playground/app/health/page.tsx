'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Clock, Database, Zap, RefreshCcw, Server } from 'lucide-react'

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001'

export default function HealthPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/health`)
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error('Failed to fetch health', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const timer = setInterval(fetchHealth, 10000)
    return () => clearInterval(timer)
  }, [])

  const metrics = [
    { label: 'Uptime', value: stats ? `${Math.floor(stats.uptime / 60)}m` : '-', icon: Activity, color: 'text-green-500' },
    { label: 'Active Processes', value: stats?.activeServers || '0', icon: Server, color: 'text-blue-500' },
    { label: 'API Status', value: stats ? 'Operational' : 'Offline', icon: Zap, color: stats ? 'text-purple-500' : 'text-red-500' },
    { label: 'Gateway Node', value: 'Local-1', icon: Database, color: 'text-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground mt-2">
            Real-time observability metrics from the India-MCP Live Gateway.
          </p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchHealth(); }}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <RefreshCcw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-xl border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold">{metric.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Gateway Connection Details
        </h2>
        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground">Endpoint</span>
            <span>{GATEWAY_URL}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground">Last Check</span>
            <span>{stats?.timestamp || '-'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Environment</span>
            <span className="text-green-500">Development</span>
          </div>
        </div>
      </div>
    </div>
  )
}
