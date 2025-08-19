'use client'

import React from 'react'
import { useTheme } from '../providers/ThemeProvider'
import { cn } from '@/utils/cn'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button' | 'switch'
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = 'md',
  variant = 'icon'
}) => {
  const { theme, toggleTheme } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-fuse-primary/50 focus:ring-offset-2',
          theme === 'dark' ? 'bg-fuse-primary' : 'bg-fuse-text-hint',
          className
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    )
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-fuse font-medium transition-all duration-200',
          'bg-fuse-surface text-fuse-text-default border border-fuse-border',
          'hover:bg-fuse-surface/80 hover:border-fuse-primary/50',
          'focus:outline-none focus:ring-2 focus:ring-fuse-primary/50 focus:ring-offset-2',
          size === 'sm' && 'text-sm px-2 py-1',
          size === 'lg' && 'text-lg px-4 py-3',
          className
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <>
            <MoonIcon className={iconSizes[size]} />
            <span>Dark</span>
          </>
        ) : (
          <>
            <SunIcon className={iconSizes[size]} />
            <span>Light</span>
          </>
        )}
      </button>
    )
  }

  // Default icon variant
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center rounded-fuse transition-all duration-200',
        'text-fuse-text-secondary hover:text-fuse-text-default',
        'hover:bg-fuse-surface focus:outline-none focus:ring-2 focus:ring-fuse-primary/50',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon className={iconSizes[size]} />
      ) : (
        <SunIcon className={iconSizes[size]} />
      )}
    </button>
  )
}

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
)

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
)
