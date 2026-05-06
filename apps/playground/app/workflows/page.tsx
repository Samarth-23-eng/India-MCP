import { Metadata } from '@/lib/metadata'
import { motion } from 'framer-motion'
import { ArrowRight, GitBranch } from 'lucide-react'

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflow Visualizer</h1>
        <p className="text-muted-foreground mt-2">
          Explore pre-built multi-server tool chains for common AI agent tasks
        </p>
      </div>

      <div className="grid gap-6">
        {Metadata.workflows.map((workflow, idx) => (
          <motion.div
            key={workflow.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-xl border bg-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <p className="text-sm text-muted-foreground">{workflow.estimatedTime}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>

            <div className="flex items-center gap-2 mb-4">
              {workflow.steps.map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className="px-3 py-1.5 rounded-md bg-muted text-xs font-mono">
                    {step.tool}
                  </div>
                  {i < workflow.steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Servers: {workflow.steps.length}</span>
              <span>•</span>
              <span>Use cases: {workflow.useCases.length}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}