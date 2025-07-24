import React from 'react'
import { cn } from '~/lib/utils'
import { TabStrip } from './TabStrip'
import { Toolbar } from './Toolbar'
import { WindowControls } from './WindowControls'

interface BrowserShellProps {
  children: React.ReactNode
  tabs?: Array<{
    id: string
    title: string
    url: string
    favicon?: React.ReactNode
    isActive?: boolean
    isPinned?: boolean
  }>
  activeTabId?: string
  currentUrl?: string
  onTabClick?: (tabId: string) => void
  onTabClose?: (tabId: string) => void
  onNewTab?: () => void
  onNavigate?: (url: string) => void
  className?: string
}

export function BrowserShell({
  children,
  tabs = [],
  activeTabId,
  currentUrl = '',
  onTabClick,
  onTabClose,
  onNewTab,
  onNavigate,
  className
}: BrowserShellProps) {
  return (
    <div className={cn(
      "firefox-ui bg-[#f9f9fb] rounded-xl shadow-2xl overflow-hidden flex flex-col",
      "border-2 border-gray-300",
      className
    )}>
      {/* Tab strip with window controls */}
      <div className="bg-[#f0f0f4] flex items-center shrink-0">
        <WindowControls />
        <div className="flex-1">
          <TabStrip
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={onTabClick}
            onTabClose={onTabClose}
            onNewTab={onNewTab}
          />
        </div>
      </div>
      
      {/* Toolbar */}
      <Toolbar
        url={currentUrl}
        onNavigate={onNavigate}
        className="shrink-0"
      />
      
      {/* Content area */}
      <div className="flex-1 bg-white overflow-hidden min-h-0">
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}