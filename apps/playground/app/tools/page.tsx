'use client'

import { useState, useEffect } from 'react'
import { Metadata } from '@/lib/metadata'
import { Search, Play, Terminal, Loader2, Key } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001'

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    setApiKey(localStorage.getItem('imcp_api_key'))
  }, [])

  const filteredServers = Metadata.servers.filter(s => 
    !selectedServer || s.key === selectedServer
  )

  const handleExecute = async (server: string, tool: string, args: any = {}) => {
    if (!apiKey) {
      alert('Please register and get an API key in the Config tab first.')
      return
    }

    const key = `${server}:${tool}`
    setExecuting(key)
    try {
      const res = await fetch(`${GATEWAY_URL}/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ server, tool, arguments: args })
      })
      const data = await res.json()
      setResponses(prev => ({ ...prev, [key]: data }))
    } catch (err: any) {
      setResponses(prev => ({ ...prev, [key]: { success: false, error: err.message } }))
    } finally {
      setExecuting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tool Explorer</h1>
          <p className="text-muted-foreground mt-2">
            Execute and test tools live via the India-MCP Gateway.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!apiKey && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs border border-yellow-500/20">
              <Key className="w-3 h-3" /> API Key Required
            </div>
          )}
          <select 
            className="h-10 px-3 rounded-lg bg-muted border-0 text-sm focus:ring-2 focus:ring-primary outline-none"
            onChange={(e) => setSelectedServer(e.target.value || null)}
          >
            <option value="">All Servers</option>
            {Metadata.servers.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              className="w-64 h-10 pl-9 pr-4 rounded-lg bg-muted border-0 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {filteredServers.map((server) => {
          const tools = [
            { name: `get_${server.key}_status`, desc: `Check health of ${server.name} service` },
            { name: `search_${server.key}_data`, desc: `Query records from ${server.name}` }
          ]

          return (
            <div key={server.key} className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-2 h-6 rounded bg-primary" />
                {server.name}
              </h2>
              <div className="grid gap-4">
                {tools.map((tool) => {
                  const key = `${server.key}:${tool.name}`
                  const response = responses[key]
                  const isExecuting = executing === key

                  return (
                    <div key={tool.name} className="rounded-xl border bg-card overflow-hidden">
                      <div className="p-4 flex items-center justify-between bg-muted/30">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-primary">{tool.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">GET</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                        </div>
                        <button 
                          disabled={isExecuting}
                          onClick={() => handleExecute(server.key, tool.name)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Execute
                        </button>
                      </div>

                      <AnimatePresence>
                        {response && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="border-t bg-black/50"
                          >
                            <div className="p-4 space-y-3 font-mono text-xs">
                              <div className="flex items-center justify-between text-muted-foreground border-b border-white/10 pb-2">
                                <span className="flex items-center gap-2"><Terminal className="w-3 h-3" /> Output</span>
                                {response.latency && <span>Latency: {response.latency}ms</span>}
                              </div>
                              <pre className={cn(
                                "max-h-60 overflow-auto scrollbar-hide",
                                response.success ? "text-green-400" : "text-red-400"
                              )}>
                                {JSON.stringify(response.data || response.error, null, 2)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
