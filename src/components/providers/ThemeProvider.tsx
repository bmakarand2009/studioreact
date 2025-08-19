'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
export type ColorScheme = 'default' | 'brand' | 'teal' | 'rose' | 'purple' | 'amber'

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  toggleTheme: () => void
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultColorScheme?: ColorScheme
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  defaultColorScheme = 'default'
}) => {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme)

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (!mounted) return

    const savedTheme = localStorage.getItem('wisely-theme') as Theme
    const savedColorScheme = localStorage.getItem('wisely-color-scheme') as ColorScheme
    
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
    
    if (savedColorScheme) {
      setColorScheme(savedColorScheme)
    }
  }, [mounted])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(theme)
    
    // Remove previous color scheme classes
    root.classList.remove('theme-default', 'theme-brand', 'theme-teal', 'theme-rose', 'theme-purple', 'theme-amber')
    
    // Add current color scheme class
    root.classList.add(`theme-${colorScheme}`)
    
    // Save to localStorage
    localStorage.setItem('wisely-theme', theme)
    localStorage.setItem('wisely-color-scheme', colorScheme)
  }, [theme, colorScheme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('wisely-theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme)
  }

  const value: ThemeContextType = {
    theme,
    colorScheme,
    toggleTheme,
    setColorScheme: handleColorSchemeChange
  }

  // Prevent hydration mismatch by not rendering theme classes until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
