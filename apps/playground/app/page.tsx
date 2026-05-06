import Link from 'next/link'
import { Metadata } from '@/lib/metadata'
import { ServerCard } from '@/components/ServerCard'

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Server Catalog</h1>
          <p className="text-muted-foreground mt-2">
            Explore all {Metadata.servers.length} production MCP servers
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500">
            {Metadata.servers.filter(s => s.stability === 'stable').length} Live
          </span>
          <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
            {Metadata.servers.filter(s => s.stability !== 'stable').length} Beta
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Metadata.servers.map((server) => (
          <ServerCard key={server.key} server={server} />
        ))}
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{Metadata.totalTools}</div>
            <div className="text-sm text-muted-foreground">Total Tools</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{Metadata.totalServers}</div>
            <div className="text-sm text-muted-foreground">MCP Servers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{Metadata.totalWorkflows}</div>
            <div className="text-sm text-muted-foreground">Workflows</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{Metadata.totalCategories}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
        </div>
      </div>
    </div>
  )
}