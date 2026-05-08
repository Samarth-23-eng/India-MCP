"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from "recharts"
import {
  Activity, Server, Zap, Clock, AlertCircle, TrendingUp,
  CheckCircle2, Wifi, WifiOff, RefreshCw
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ServerMetrics {
  requestCount: number
  errorCount: number
  successRate: string
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  lastUsed: string
}

interface MetricsData {
  activeServers: number
  activeExecutions: Record<string, number>
  uptime: number
  memoryUsageMB: number
  servers: Record<string, ServerMetrics>
  rateLimiting: Record<string, number>
  timestamp: string
}

interface HistoryPoint {
  time: string
  totalRequests: number
  avgLatency: number
  activeServers: number
  errors: number
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

function getSuccessColor(rate: string): string {
  const n = parseFloat(rate)
  if (isNaN(n)) return "hsl(var(--muted-foreground))"
  if (n >= 99) return "#22c55e"
  if (n >= 95) return "#eab308"
  return "#ef4444"
}

const SERVER_COLORS = [
  "#8b5cf6","#06b6d4","#f59e0b","#10b981",
  "#ec4899","#6366f1","#14b8a6","#f97316","#84cc16"
]

function MetricCard({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm p-5 group hover:border-primary/30 transition-all duration-300">
      {accent && (
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20"
          style={{ background: accent }} />
      )}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-3xl font-extrabold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function LatencyChart({ servers }: { servers: Record<string, ServerMetrics> }) {
  const data = Object.entries(servers).map(([name, m]) => ({
    name: name.length > 8 ? name.slice(0, 8) + "…" : name,
    p50: m.p50LatencyMs,
    p95: m.p95LatencyMs,
    p99: m.p99LatencyMs,
  }))
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No latency data yet. Execute some tools first.
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}ms`} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem", fontSize: 12 }}
          formatter={(v: number) => [`${v}ms`, ""]}
        />
        <Bar dataKey="p50" fill="#8b5cf6" radius={[4,4,0,0]} name="p50" />
        <Bar dataKey="p95" fill="#06b6d4" radius={[4,4,0,0]} name="p95" />
        <Bar dataKey="p99" fill="#f59e0b" radius={[4,4,0,0]} name="p99" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function RequestVolumeChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Collecting data… needs 2+ samples
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem", fontSize: 12 }}
        />
        <Area type="monotone" dataKey="totalRequests" stroke="#8b5cf6" fill="url(#reqGrad)"
          strokeWidth={2} name="Requests" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function ServerTable({ servers }: { servers: Record<string, ServerMetrics> }) {
  const entries = Object.entries(servers)
  if (entries.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No server metrics yet.</div>
  }
  const totalReqs = entries.reduce((s, [, m]) => s + m.requestCount, 0)
  const totalErrs = entries.reduce((s, [, m]) => s + m.errorCount, 0)
  return (
    <div className="space-y-3">
      {entries.map(([name, m], i) => (
        <div key={name} className="flex items-center gap-4 p-4 rounded-xl border bg-card/40 hover:bg-card/70 transition-colors">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            style={{ background: SERVER_COLORS[i % SERVER_COLORS.length] }}>
            {name.slice(0, 3).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{name}</span>
              <span className={`inline-flex items-center gap-1 text-xs ${m.requestCount > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                {m.requestCount > 0 ? <><CheckCircle2 className="w-3 h-3" /> Live</> : <><Clock className="w-3 h-3" /> Idle</>}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>{m.requestCount} reqs</span>
              <span>avg {fmtMs(m.avgLatencyMs)}</span>
              <span>p95 {fmtMs(m.p95LatencyMs)}</span>
              <span>p99 {fmtMs(m.p99LatencyMs)}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold" style={{ color: getSuccessColor(m.successRate) }}>{m.successRate}</div>
            <div className="text-xs text-muted-foreground">success</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold">{m.errorCount}</div>
            <div className="text-xs text-muted-foreground">errors</div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t">
        <span>Total: {totalReqs} requests</span>
        <span>{totalErrs} errors</span>
        <span>{totalReqs > 0 ? ((totalReqs - totalErrs) / totalReqs * 100).toFixed(1) : "0"}% success</span>
      </div>
    </div>
  )
}

const POLL_INTERVAL = 5000
const HISTORY_MAX = 60

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics-proxy")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: MetricsData = await res.json()
      setData(json)
      setConnected(true)
      setLastUpdate(new Date())
      setError(null)
      setHistory(prev => {
        const totalReqs = Object.values(json.servers).reduce((s, m) => s + m.requestCount, 0)
        const avgLat = Object.values(json.servers).length > 0
          ? Object.values(json.servers).reduce((s, m) => s + m.avgLatencyMs, 0) / Object.values(json.servers).length
          : 0
        const point: HistoryPoint = {
          time: new Date().toLocaleTimeString(),
          totalRequests: totalReqs,
          avgLatency: avgLat,
          activeServers: json.activeServers,
          errors: Object.values(json.servers).reduce((s, m) => s + m.errorCount, 0)
        }
        const next = [...prev, point]
        return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next
      })
      setLoading(false)
    } catch (err: any) {
      setConnected(false)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    intervalRef.current = setInterval(fetchMetrics, POLL_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchMetrics])

  const servers = data?.servers ?? {}
  const totalRequests = Object.values(servers).reduce((s, m) => s + m.requestCount, 0)
  const totalErrors = Object.values(servers).reduce((s, m) => s + m.errorCount, 0)
  const overallSuccess = totalRequests > 0
    ? ((totalRequests - totalErrors) / totalRequests * 100).toFixed(1) + "%"
    : "—"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Observatory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time platform metrics — polling every {POLL_INTERVAL / 1000}s
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {connected
              ? <><div className="relative flex items-center justify-center"><Wifi className="w-4 h-4 text-green-500" /><div className="absolute w-4 h-4 rounded-full bg-green-500/30 animate-ping" /></div><span className="text-xs text-green-600 dark:text-green-400 font-medium">Live{lastUpdate ? ` ${formatDistanceToNow(lastUpdate, { addSuffix: true })}` : ""}</span></>
              : <><WifiOff className="w-4 h-4 text-red-500" /><span className="text-xs text-red-600 dark:text-red-400 font-medium">Disconnected</span></>
            }
          </div>
          <button onClick={fetchMetrics}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Gateway unreachable</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Activity} label="Total Requests" value={totalRequests}
          sub="across all servers" accent="#8b5cf6" />
        <MetricCard icon={Zap} label="Avg Latency" value={data && Object.values(servers).length > 0
          ? fmtMs(Object.values(servers).reduce((s, m) => s + m.avgLatencyMs, 0) / Object.values(servers).length)
          : "—"} sub="p50 across servers" accent="#06b6d4" />
        <MetricCard icon={Server} label="Active Servers"
          value={data?.activeServers ?? 0} sub={`of ${Object.keys(servers).length} total`} accent="#10b981" />
        <MetricCard icon={totalErrors === 0 ? CheckCircle2 : AlertCircle}
          label="Success Rate" value={overallSuccess}
          sub={`${totalErrors} errors`} accent={totalErrors === 0 ? "#22c55e" : "#ef4444"} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Request Volume
            </h2>
            <span className="text-xs text-muted-foreground">Last {HISTORY_MAX} samples</span>
          </div>
          <RequestVolumeChart history={history} />
        </div>
        <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Latency by Server
            </h2>
            <span className="text-xs text-muted-foreground">p50 / p95 / p99</span>
          </div>
          <LatencyChart servers={servers} />
        </div>
      </div>

      {/* System info */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card/40 p-5 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">System</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span className="font-mono font-medium">{data ? formatUptime(data.uptime) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Heap</span><span className="font-mono font-medium">{data ? `${data.memoryUsageMB} MB` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Executing</span><span className="font-mono font-medium">{data ? Object.values(data.activeExecutions).reduce((s,v) => s+v, 0) : "—"}</span></div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card/40 p-5 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rate Limiting</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tracked keys</span><span className="font-mono font-medium">{data?.rateLimiting?.trackedKeys ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tracked IPs</span><span className="font-mono font-medium">{data?.rateLimiting?.trackedIps ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Key requests</span><span className="font-mono font-medium">{data?.rateLimiting?.totalKeyRequests ?? 0}</span></div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card/40 p-5 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Active Servers</h3>
          <div className="space-y-1">
            {Object.keys(servers).length === 0 && <p className="text-xs text-muted-foreground">No active servers</p>}
            {Object.entries(servers).map(([name, m], i) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: SERVER_COLORS[i % SERVER_COLORS.length] }} />
                  <span className="font-medium">{name}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{(data?.activeExecutions ?? {})[name] ?? 0} running</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Server table */}
      <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> Per-Server Breakdown
          </h2>
        </div>
        <ServerTable servers={servers} />
      </div>
    </div>
  )
}
