import React, { forwardRef } from 'react'
import { cn } from '~/lib/utils'
import { TabStrip } from './TabStrip'
import { Toolbar } from './Toolbar'
import { type AddressBarHandle } from './AddressBar'
import { WindowControls } from './WindowControls'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu'
import { PlusIcon } from '~/components/icons'

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
  onTabReorder?: (draggedTabId: string, targetTabId: string, dropBefore: boolean) => void
  onNavigate?: (url: string) => void
  onBack?: () => void
  onForward?: () => void
  onRefresh?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
  className?: string
  onNewTabBelow?: () => void
  onCompareTabs?: () => void
  onCloseBothTabs?: () => void
  showSplitView?: boolean
  onSidebarToggle?: () => void
}

export const BrowserShell = forwardRef<AddressBarHandle, BrowserShellProps>(function BrowserShell({
  children,
  tabs = [],
  activeTabId,
  currentUrl = '',
  onTabClick,
  onTabClose,
  onNewTab,
  onTabReorder,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  canGoBack = false,
  canGoForward = false,
  className,
  onNewTabBelow,
  onCompareTabs,
  onCloseBothTabs,
  showSplitView,
  onSidebarToggle
}, ref) {
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
                onTabReorder={onTabReorder}
              />
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onNewTab}>
            <PlusIcon />
            <span className="ml-2">New Tab</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Toolbar */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div id="firefox-toolbar" className="browser-chrome">
            <Toolbar
              ref={ref}
              url={currentUrl}
              onNavigate={onNavigate}
              onNewTab={onNewTab}
              onBack={onBack}
              onForward={onForward}
              onRefresh={onRefresh}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              className="shrink-0"
              onNewTabBelow={onNewTabBelow}
              onCompareTabs={onCompareTabs}
              onCloseBothTabs={onCloseBothTabs}
              showSplitView={showSplitView}
              onSidebarToggle={onSidebarToggle}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onNewTab}>
            <PlusIcon />
            <span className="ml-2">New Tab</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Content area */}
      <div id="firefox-content-area" className="flex-1 flex overflow-hidden min-h-0 browser-content">
        {children}
      </div>
    </div>
  )
})