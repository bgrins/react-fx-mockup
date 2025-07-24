import React from 'react'
import { cn } from '~/lib/utils'
import { TabStrip } from './TabStrip'
import { Toolbar } from './Toolbar'
import { WindowControls } from './WindowControls'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu'
import { Plus } from 'lucide-react'

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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div id="firefox-tab-strip" className="bg-[#f0f0f4] flex items-center shrink-0 browser-chrome">
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
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onNewTab}>
            <Plus className="mr-2 h-4 w-4" />
            New Tab
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Toolbar */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div id="firefox-toolbar" className="browser-chrome">
            <Toolbar
              url={currentUrl}
              onNavigate={onNavigate}
              onNewTab={onNewTab}
              className="shrink-0"
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onNewTab}>
            <Plus className="mr-2 h-4 w-4" />
            New Tab
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Content area */}
      <div id="firefox-content-area" className="flex-1 bg-white overflow-hidden min-h-0 browser-content">
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}