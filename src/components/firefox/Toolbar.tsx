import React from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Menu } from 'lucide-react'
import { cn } from '~/lib/utils'
import { AddressBar } from './AddressBar'

interface ToolbarProps {
  url?: string | undefined
  onBack?: (() => void) | undefined
  onForward?: (() => void) | undefined
  onRefresh?: (() => void) | undefined
  onNavigate?: ((url: string) => void) | undefined
  canGoBack?: boolean | undefined
  canGoForward?: boolean | undefined
  className?: string | undefined
}

export function Toolbar({
  url = '',
  onBack,
  onForward,
  onRefresh,
  onNavigate,
  canGoBack = true,
  canGoForward = true,
  className
}: ToolbarProps) {
  return (
    <div className={cn("h-10 bg-[#f9f9fb] flex items-center gap-1 px-2 py-1", className)}>
      {/* Left actions */}
      <div className="flex items-center gap-1">
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)] disabled:opacity-50"
          onClick={onBack}
          disabled={!canGoBack}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)] disabled:opacity-50"
          onClick={onForward}
          disabled={!canGoForward}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]"
          onClick={onRefresh}
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
      
      {/* Address bar */}
      <div className="flex-1 px-16">
        <AddressBar url={url} onNavigate={onNavigate} />
      </div>
      
      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ToolbarIcon icon={<DownloadsIcon />} />
        <ToolbarIcon icon={<AccountIcon />} />
        <ToolbarIcon icon={<ExtensionsIcon />} />
        <ToolbarIcon icon={<Menu className="w-4 h-4" />} />
      </div>
    </div>
  )
}

interface ToolbarIconProps {
  icon: React.ReactNode
  onClick?: () => void
  badge?: boolean
}

function ToolbarIcon({ icon, onClick, badge }: ToolbarIconProps) {
  return (
    <button 
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)] relative"
      onClick={onClick}
    >
      {icon}
      {badge && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </button>
  )
}

function DownloadsIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path d="M7 0v10m0 0l3.5-3.5M7 10L3.5 6.5M1 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ExtensionsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 1h4v3.5a1.5 1.5 0 001.5 1.5H15v4h-3.5a1.5 1.5 0 00-1.5 1.5V15H6v-3.5A1.5 1.5 0 004.5 10H1V6h3.5A1.5 1.5 0 006 4.5V1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}