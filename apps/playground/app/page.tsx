'use client'

import { motion } from 'framer-motion'
import { Metadata } from '@/lib/metadata'
import { ServerCard } from '@/components/ServerCard'
import { Zap, Shield, ArrowUpRight, Github, Package } from 'lucide-react'

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative py-10 md:py-16 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border">
        <div className="px-8 md:px-12 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-current" /> India-MCP Ecosystem
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Production MCP <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Infrastructure</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto md:mx-0">
              High-availability Model Context Protocol servers for Indian finance, legal, and government APIs.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Explore Tools
              </button>
              <a href="https://github.com/Samarth-23-eng/India-MCP" target="_blank" rel="noopener noreferrer" className="h-12 px-8 rounded-full border bg-background/50 backdrop-blur-sm font-bold flex items-center gap-2 hover:bg-muted transition-all">
                <Github className="w-5 h-5" /> GitHub
              </a>
            </div>
          </div>
          <div className="flex-1 hidden md:block relative h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full" />
            <div className="relative grid grid-cols-2 gap-4">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="aspect-square rounded-2xl border bg-card/40 backdrop-blur-md p-4 animate-pulse-slow">
                   <div className="w-8 h-8 rounded-lg bg-primary/10 mb-3" />
                   <div className="h-2 w-16 bg-muted rounded mb-2" />
                   <div className="h-2 w-10 bg-muted rounded" />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tools', value: Metadata.totalTools, icon: Zap },
          { label: 'Live Servers', value: Metadata.totalServers, icon: Package },
          { label: 'Domains', value: Metadata.totalCategories, icon: Shield },
          { label: 'Workflows', value: Metadata.totalWorkflows, icon: ArrowUpRight },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm space-y-2">
            <stat.icon className="w-5 h-5 text-primary" />
            <div className="text-3xl font-extrabold">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Catalog Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 rounded bg-primary" />
            Server Catalog
          </h2>
          <button className="text-sm font-semibold text-primary hover:underline">View All →</button>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {Metadata.servers.map((server) => (
            <ServerCard key={server.key} server={server} />
          ))}
        </motion.div>
      </section>
    </div>
  )
}
