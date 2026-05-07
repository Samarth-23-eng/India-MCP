'use client'

import { Toaster } from 'sonner'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'
import { CommandPalette } from '@/components/CommandPalette'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { getApiKey } from '@/lib/auth'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Pre-warm auth state on first client render
  useEffect(() => {
    getApiKey()
  }, [])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Navbar />
            <main className="flex-1 overflow-y-auto relative scroll-smooth">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="p-6 md:p-8 max-w-7xl mx-auto w-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
        <CommandPalette />
        <Toaster position="bottom-right" theme="dark" closeButton />
      </body>
    </html>
  )
}
