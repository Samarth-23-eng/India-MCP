'use client'

import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { Metadata } from '@/lib/metadata'
import { Search, Server, Zap, GitBranch, Settings, Activity } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  // Handle hydration: ensure component is mounted before rendering
  // to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Don't render on server or before hydration to prevent mismatch
  if (!mounted || !open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-10" onClick={() => setOpen(false)}>
      <div className="w-full max-w-2xl h-[450px]" onClick={e => e.stopPropagation()}>
        <Command label="Command Menu">
          <Command.Input placeholder="Search tools, servers, or settings..." />
          <Command.List className="scrollbar-hide overflow-y-auto">
            <Command.Empty className="p-8 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
            
            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => { router.push('/'); setOpen(false); }}>
                <Activity className="w-4 h-4" /> <span>Dashboard</span>
              </Command.Item>
              <Command.Item onSelect={() => { router.push('/tools'); setOpen(false); }}>
                <Zap className="w-4 h-4" /> <span>Playground</span>
              </Command.Item>
              <Command.Item onSelect={() => { router.push('/workflows'); setOpen(false); }}>
                <GitBranch className="w-4 h-4" /> <span>Workflows</span>
              </Command.Item>
              <Command.Item onSelect={() => { router.push('/config'); setOpen(false); }}>
                <Settings className="w-4 h-4" /> <span>API Config</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="MCP Servers">
              {Metadata.servers.map(s => (
                <Command.Item key={s.key} onSelect={() => { router.push(`/tools?server=${s.key}`); setOpen(false); }}>
                  <Server className="w-4 h-4" /> <span>{s.name} Server</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
