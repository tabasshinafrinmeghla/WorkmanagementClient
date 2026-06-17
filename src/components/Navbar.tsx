"use client"

import React, { useEffect, useState } from 'react'
import { Bell, Home, Sun, Moon } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeMode, toggleTheme, setTheme } from '../store/themeSlice'
import { RootState } from '../store'

const Navbar: React.FC = () => {
  const dispatch = useDispatch()
  const themeMode = useSelector((state: RootState) => state.theme.mode) as ThemeMode
  
  // ✅ Correctly trigger state update once component mounts on client side
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as ThemeMode) || 'light'
    dispatch(setTheme(saved))
    setMounted(true) // Now this triggers a clean UI update on the client
  }, [dispatch])

  return (
    <nav className="w-full border-b bg-background shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left — Profile circle */}
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-muted" />
        </div>

        {/* Right — Navigation and brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">

            {/* Notification */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Badge className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-2 border-background text-[10px] font-bold p-0">
                3
              </Badge>
            </Button>

            {/* Home */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Home"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* ✅ Theme toggle slider */}
            <div
              onClick={() => dispatch(toggleTheme())}
              className="flex h-7 w-14 cursor-pointer items-center rounded-full bg-muted p-1 transition-colors duration-300 relative"
              role="button"
              aria-label="Toggle theme"
            >
              <Sun className="h-3.5 w-3.5 text-muted-foreground absolute left-1.5" />

              <div
                className={`h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-300 flex items-center justify-center z-10 ${
                  mounted && themeMode === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />

              <Moon className="h-3.5 w-3.5 text-muted-foreground absolute right-1.5" />
            </div>

          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
              <span className="text-sm font-bold">M</span>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">MyApp</span>
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar