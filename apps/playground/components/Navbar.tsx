'use client'

import { motion } from 'framer-motion'
import { Search, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tools, servers, workflows..."
            className="w-80 h-9 pl-9 pr-4 rounded-lg bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-muted"
        >
          {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </motion.button>
        <a
          href="https://github.com/Samarth-23-eng/India-MCP"
          target="_blank"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </header>
  )
}