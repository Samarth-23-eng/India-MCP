'use client'

import { motion } from 'framer-motion'
import { Server } from '@/lib/metadata'
import { cn } from '@/lib/utils'
import { ArrowRight, Layers, Shield, Zap, Globe, Package } from 'lucide-react'
import Link from 'next/link'

interface ServerCardProps {
  server: Server
}

export function ServerCard({ server }: ServerCardProps) {
  const stabilityColors = {
    stable: 'bg-green-500/10 text-green-500 border-green-500/20',
    beta: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    experimental: 'bg-red-500/10 text-red-500 border-red-500/20',
  } as const

  const riskColors = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  } as const

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Package className="w-24 h-24 rotate-12" />
      </div>

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">{server.name}</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Globe className="w-3 h-3" /> @imcp/{server.key}
            </div>
          </div>
          <span className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
            stabilityColors[server.stability]
          )}>
            {server.stability}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {server.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {server.categories.slice(0, 2).map((cat) => (
            <span key={cat} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              {cat}
            </span>
          ))}
          {server.categories.length > 2 && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
              +{server.categories.length - 2}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tools</div>
            <div className="flex items-center gap-1.5 font-bold">
              <Layers className="w-4 h-4 text-primary" /> {server.toolCount}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Risk</div>
            <div className={cn('flex items-center gap-1.5 font-bold capitalize', riskColors[server.maxRiskLevel])}>
              <Shield className="w-4 h-4" /> {server.maxRiskLevel}
            </div>
          </div>
        </div>

        <Link 
          href={`/tools?server=${server.key}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-muted/50 font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all group/btn"
        >
          Open Playground
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  )
}
