// src/components/Navbar.tsx
"use client" // 👈 এই লাইনটি Next.js-কে বলবে এটি একটি ক্লায়েন্ট কম্পোনেন্ট

import React from 'react'
import { Bell, Home, Sun, Moon } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeMode, toggleTheme } from '../store/themeSlice'
import { RootState } from '../store'
// import { RootState } from '../store'

const Navbar: React.FC = () => {
  const dispatch = useDispatch()
  
  // RootState টাইপ ব্যবহার করে স্টেট রিড করা
  const themeMode = useSelector((state: RootState ) => state.theme.mode) as ThemeMode

  return (
    <nav className="w-full border-b bg-background shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* বাম দিক — ছবির মতো প্রোফাইল সার্কেল */}
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-muted" />
        </div>

        {/* ডান দিক — নেভিগেশন এবং ব্র্যান্ড লোগো */}
        <div className="flex items-center gap-4">

          {/* বাটনের গ্রুপ */}
          <div className="flex items-center gap-1">
            
            {/* নোটিফিকেশন */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Badge
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-2 border-background text-[10px] font-bold p-0"
              >
                3
              </Badge>
            </Button>

            {/* হোম বাটন */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Home"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* কাস্টম থিম টগল সুইচ (image_3c8389.png অনুযায়ী) */}
            <div 
              onClick={() => dispatch(toggleTheme())}
              className="flex h-7 w-14 cursor-pointer items-center rounded-full bg-muted p-1 transition-colors duration-300 relative"
              role="button"
              aria-label="Toggle theme"
            >
              {/* লাইট মোড আইকন */}
              <Sun className="h-3.5 w-3.5 text-muted-foreground absolute left-1.5" />
              
              {/* স্লাইডিং সার্কেল পিল */}
              <div 
                className={`h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-300 flex items-center justify-center z-10 ${
                  themeMode === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
              
              {/* ডার্ক মোড আইকন */}
              <Moon className="h-3.5 w-3.5 text-muted-foreground absolute right-1.5" />
            </div>

          </div>

          {/* ডিভাইডার */}
          <div className="h-6 w-px bg-border" />

          {/* লোগো এবং নাম */}
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