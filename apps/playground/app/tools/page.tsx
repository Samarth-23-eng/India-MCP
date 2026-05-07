"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Metadata } from '@/lib/metadata'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Play, Copy, Terminal, Loader2, Info, Clock, CheckCircle2, XCircle, History, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getApiKey } from '@/lib/auth'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string
  server: string
  tool: string
  args: string
  response: unknown
  latency: number
  success: boolean
  timestamp: number
  source?: string
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const HISTORY_KEY = 'india-mcp-playground-history'
const MAX_HISTORY = 50

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch { return [] }
}

function saveHistory(hist: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, MAX_HISTORY)))
  } catch {}
}

// ─── Timeline Component ────────────────────────────────────────────────────────

function TimelineBadge({ latency }: { latency: number }) {
  const color = latency < 500 ? 'text-green-500 bg-green-500/10'
    : latency < 2000 ? 'text-amber-500 bg-amber-500/10'
    : 'text-red-500 bg-red-500/10'
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold', color)}>
      <Clock className="w-3 h-3" />
      {latency}ms
    </span>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const DEFAULT_ARGS: Record<string, string> = {
  stocks: '{\n  "symbol": "RELIANCE"\n}',
  gst: '{\n  "gstin": "27AABCU9603R1ZM"\n}',
  fssai: '{\n  "licenseNumber": "10015011000106"\n}',
  ecourts: '{\n  "caseType": "Civil",\n  "caseNumber": "1"\n}',
  razorpay: '{\n  "amount": 1000,\n  "currency": "INR"\n}',
  bankifsc: '{\n  "ifsc": "SBIN0001234"\n}',
}

export default function ToolsPage() {
  const [selectedServer, setSelectedServer] = useState<string>(Metadata.servers[0].key)
  const [selectedTool, setSelectedTool] = useState<string>('')
  const [args, setArgs] = useState('')
  const [executing, setExecuting] = useState(false)
  const [response, setResponse] = useState<{ data: unknown; latency: number; success: boolean; source?: string; error?: string; timeline?: unknown[] } | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  const argsRef = useRef<HTMLTextAreaElement>(null)

  const activeServer = Metadata.servers.find(s => s.key === selectedServer) || Metadata.servers[0]

  // Load history and default args on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setHistory(loadHistory())
    setArgs(DEFAULT_ARGS[selectedServer] ?? '{\n  "key": "value"\n}')
    setSelectedTool(activeServer.tools[0]?.name ?? '')
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setArgs(DEFAULT_ARGS[selectedServer] ?? '{\n  "key": "value"\n}')
    setSelectedTool(activeServer.tools[0]?.name ?? '')
    setResponse(null)
  }, [selectedServer])

  const handleExecute = useCallback(async () => {
    setExecuting(true)
    setResponse(null)
    try {
      let parsedArgs: Record<string, unknown> = {}
      try { parsedArgs = JSON.parse(args) } catch { throw new Error('Invalid JSON arguments') }

      const API_KEY = getApiKey()
      if (!API_KEY) {
        toast.error('No API key. Generate one in Config → Dashboard, then try again.')
        setExecuting(false)
        return
      }

      const start = Date.now()
      const res = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {})
        },
        body: JSON.stringify({ server: selectedServer, tool: selectedTool, arguments: parsedArgs })
      })

      const data = await res.json()
      const latency = Date.now() - start

      if (data.success) {
        toast.success(`${selectedServer}/${selectedTool} executed in ${latency}ms`)
        setResponse({ data: data.data, latency, success: true, source: data.source, timeline: data.timeline })
      } else {
        toast.error(data.error ?? 'Execution failed')
        setResponse({ data: null, latency, success: false, error: data.error, timeline: data.timeline })
      }

      // Save to history
      const entry: HistoryEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        server: selectedServer, tool: selectedTool,
        args, response: data, latency, success: !!data.success,
        timestamp: Date.now(), source: data.source
      }
      setHistory(prev => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY)
        saveHistory(next)
        return next
      })

    } catch (err: any) {
      toast.error(err.message)
      setResponse({ data: null, latency: 0, success: false, error: err.message })
    } finally {
      setExecuting(false)
    }
  }, [selectedServer, selectedTool, args])

  const handleCopy = useCallback(() => {
    if (!response) return
    const text = JSON.stringify(
      response.success ? { success: true, data: response.data, source: response.source }
        : { success: false, error: response.error },
      null, 2
    )
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard')
    })
  }, [response])

  const handleHistoryLoad = useCallback((entry: HistoryEntry) => {
    setSelectedServer(entry.server)
    setArgs(entry.args)
    if (entry.response) {
      const r = entry.response as { success: boolean; data?: unknown; error?: string; source?: string }
      setResponse({ data: r.data ?? null, latency: entry.latency, success: r.success, error: r.error, source: r.source })
    }
    setShowHistory(false)
  }, [])

  const handleHistoryClear = useCallback(() => {
    setHistory([])
    saveHistory([])
    toast.success('History cleared')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleExecute()
    }
  }, [handleExecute])

  const responseDisplay = response
    ? response.success
      ? { success: true, latency: response.latency, source: response.source, data: response.data }
      : { success: false, latency: response.latency, error: response.error }
    : null

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">JSON-RPC Playground</h1>
          <p className="text-muted-foreground mt-1">
            Live tool execution via POST /execute &mdash; <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">⌘↵</kbd> to run
          </p>
        </div>
        <button
          onClick={() => setShowHistory(v => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
            showHistory ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted/50 border-transparent hover:bg-muted'
          )}
        >
          <History className="w-4 h-4" />
          History
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border bg-card p-4 space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Request History</h3>
                <button onClick={handleHistoryClear}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              {history.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No history yet.</p>
              )}
              {history.map(entry => (
                <div key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors"
                  onClick={() => handleHistoryLoad(entry)}>
                  {entry.success
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold">{entry.server}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-mono text-primary">{entry.tool}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs font-mono',
                    entry.latency < 500 ? 'text-green-500' : entry.latency < 2000 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {entry.latency}ms
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">

        {/* Left panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Server + Tool selection */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Server</label>
              <div className="relative">
                <select
                  className="w-full h-11 px-3 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer pr-10"
                  value={selectedServer}
                  onChange={e => setSelectedServer(e.target.value)}
                >
                  {Metadata.servers.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tool</label>
              <div className="relative">
                <select
                  className="w-full h-11 px-3 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer pr-10"
                  value={selectedTool}
                  onChange={e => setSelectedTool(e.target.value)}
                >
                  {activeServer.tools.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Arguments (JSON)
              </label>
              <textarea
                ref={argsRef}
                className="w-full h-40 p-4 rounded-xl bg-black/60 border border-border/50 font-mono text-xs focus:ring-2 focus:ring-primary/50 outline-none resize-none text-green-400 placeholder:text-green-400/30"
                value={args}
                onChange={e => setArgs(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='{\n  "key": "value"\n}'
                spellCheck={false}
              />
            </div>

            <button
              onClick={handleExecute}
              disabled={executing || !selectedTool}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              {executing
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Executing…</>
                : <><Play className="w-5 h-5 fill-current" /> Run Tool</>
              }
            </button>
          </div>

          {/* Server metadata */}
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-indigo-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Info className="w-4 h-4" /> <span>Server Info</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-primary/10 pb-1.5">
                <span className="text-muted-foreground">Package</span>
                <span className="font-mono">@imcp/{activeServer.key}</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-1.5">
                <span className="text-muted-foreground">Stability</span>
                <span className={cn(
                  'capitalize font-medium',
                  activeServer.stability === 'stable' ? 'text-green-500' : 'text-amber-500'
                )}>{activeServer.stability}</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-1.5">
                <span className="text-muted-foreground">Auth</span>
                <span>{activeServer.requiresAuth ? '🔐 Required' : '🔓 None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tools</span>
                <span className="font-medium">{activeServer.tools.length} available</span>
              </div>
            </div>

            {/* Tool list */}
            <div className="pt-2 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tools</p>
              {activeServer.tools.slice(0, 6).map(t => (
                <div key={t.name} className="flex items-center gap-2 text-xs py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span className="font-mono text-muted-foreground">{t.name}</span>
                </div>
              ))}
              {activeServer.tools.length > 6 && (
                <p className="text-[10px] text-muted-foreground">+{activeServer.tools.length - 6} more</p>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className="rounded-2xl border bg-card flex flex-col h-full overflow-hidden shadow-sm flex-1">
            {/* Toolbar */}
            <div className="h-12 border-b bg-muted/20 px-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Terminal className="w-4 h-4" />
                <span>RESPONSE</span>
                {response && response.source && (
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">
                    {response.source}
                  </span>
                )}
              </div>
              {response && (
                <div className="flex items-center gap-3">
                  <TimelineBadge latency={response.latency} />
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            {/* Response area */}
            <div className="flex-1 overflow-auto bg-[#0d0d0d] relative min-h-[400px]">
              {!response && !executing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                    <Terminal className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">Ready to execute</p>
                  <p className="text-xs text-muted-foreground mt-1">Select a server, enter arguments, and run</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">⌘↵ to run · history saved locally</p>
                </div>
              )}

              {executing && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]/80 backdrop-blur-[2px] z-10">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Executing {selectedServer}/{selectedTool}…</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 font-mono">POST /execute</p>
                  </div>
                </div>
              )}

              {responseDisplay && (
                <SyntaxHighlighter
                  language="json"
                  style={vscDarkPlus}
                  customStyle={{
                    background: 'transparent',
                    padding: '1.5rem',
                    fontSize: '13px',
                    margin: 0,
                    minHeight: '100%'
                  }}
                  showLineNumbers
                  lineNumberStyle={{ color: '#4a4a5a', fontSize: '11px', minWidth: '2.5em' }}
                >
                  {JSON.stringify(responseDisplay, null, 2)}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
