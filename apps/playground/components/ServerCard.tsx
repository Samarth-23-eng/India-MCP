'use client'

import { motion } from 'framer-motion'
import { Server } from '@/lib/metadata'
import { cn } from '@/lib/utils'
import { ArrowRight, Layers, Shield, Zap } from 'lucide-react'

interface ServerCardProps {
  server: Server
}

export function ServerCard({ server }: ServerCardProps) {
  const stabilityColors = {
    stable: 'bg-green-500/20 text-green-500',
    beta: 'bg-yellow-500/20 text-yellow-500',
    experimental: 'bg-red-500/20 text-red-500',
  } as const

  const riskColors = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  } as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{server.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {server.description}
          </p>
        </div>
        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            stabilityColors[server.stability]
          )}
        >
          {server.stability}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {server.categories.map((cat) => (
          <span
            key={cat}
            className="px-2 py-0.5 rounded-md bg-muted/50 text-xs text-muted-foreground"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {server.toolCount} tools
          </span>
          <span className={cn('flex items-center gap-1', riskColors[server.maxRiskLevel])}>
            <Shield className="w-3 h-3" />
            {server.maxRiskLevel}
          </span>
        </div>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Zap className="w-3 h-3" />
          {server.requiresAuth ? 'Auth' : 'No Auth'}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t">
        <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          View Details
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}