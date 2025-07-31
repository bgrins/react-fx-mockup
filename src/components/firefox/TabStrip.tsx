import React from 'react'
import { CloseIcon, PlusIcon } from '~/components/icons'
import { cn } from '~/lib/utils'

interface Tab {
  id: string
  title: string
  url: string
  favicon?: React.ReactNode
  isActive?: boolean
  isPinned?: boolean
}

interface TabStripProps {
  tabs: Tab[]
  activeTabId?: string | undefined
  onTabClick?: ((tabId: string) => void) | undefined
  onTabClose?: ((tabId: string) => void) | undefined
  onNewTab?: (() => void) | undefined
}

export function TabStrip({ 
  tabs, 
  onTabClick, 
  onTabClose,
  onNewTab 
}: TabStripProps) {
  return (
    <div className="bg-[#f0f0f4] h-11 flex items-center px-0">
      <div className="flex-1 flex items-center gap-1 px-2">
        {/* Firefox View and other pinned tabs */}
        {tabs.filter(tab => tab.isPinned).map((tab) => {
          return (
            <div className="flex items-center gap-1 pr-1 border-r border-[#cfcfd8] h-full" key={tab.id}>
              <div
                className={cn(
                  "relative flex items-center gap-2 h-9 px-0 py-[5px] rounded cursor-pointer group",
                  "w-9 justify-center",
                  tab.isActive 
                    ? "bg-white shadow-[0px_0px_1px_0px_rgba(0,0,0,0.15),0px_1px_2px_0px_rgba(0,0,0,0.2)]" 
                    : "hover:bg-[rgba(21,20,26,0.05)]"
                )}
                onClick={() => onTabClick?.(tab.id)}
              >
                {tab.isActive && (
                  <div className="absolute inset-0 rounded border-t-2 border-[#0062fa] pointer-events-none" />
                )}
                
                <div className="shrink-0 w-4 h-4">
                  {tab.favicon || <div className="w-4 h-4 bg-gray-300 rounded-sm" />}
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Regular tabs */}
        {tabs.filter(tab => !tab.isPinned).map((tab, index, filteredTabs) => {
          const isSplitTab = tab.id.includes('airbnb') && tabs.filter(t => t.id.includes('airbnb')).length > 1
          
          const nextTab = filteredTabs[index + 1]
          const showSeparator = isSplitTab && nextTab && nextTab.id.includes('airbnb')
          
          return (
            <React.Fragment key={tab.id}>
              <div
                className={cn(
                  "relative flex items-center gap-2 h-9 px-2 py-[5px] rounded cursor-pointer group",
                  isSplitTab ? "w-[127.5px]" : "w-[224px]",
                  tab.isActive 
                    ? "bg-white shadow-[0px_0px_1px_0px_rgba(0,0,0,0.15),0px_1px_2px_0px_rgba(0,0,0,0.2)]" 
                    : "hover:bg-[rgba(21,20,26,0.05)]"
                )}
                onClick={() => onTabClick?.(tab.id)}
              >
              {tab.isActive && (
                <div className="absolute inset-0 rounded border-t-2 border-[#0062fa] pointer-events-none" />
              )}
              
              <div className="shrink-0 w-4 h-4">
                {tab.favicon || <div className="w-4 h-4 bg-gray-300 rounded-sm" />}
              </div>
              
              <span className={cn(
                "flex-1 text-[13px] text-[#15141a] truncate font-sans font-normal",
                !tab.isActive && "opacity-90"
              )}>
                {tab.title}
              </span>
              
              {!tab.isPinned && (
                <button
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[rgba(0,0,0,0.08)] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose?.(tab.id)
                  }}
                >
                  <CloseIcon />
                </button>
              )}
              </div>
              {showSeparator && (
                <div className="w-px h-[26px] bg-gray-300/50" />
              )}
            </React.Fragment>
          )
        })}
        
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]"
          onClick={onNewTab}
        >
          <PlusIcon />
        </button>
      </div>
      
      <button className="w-8 h-8 mr-6 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]">
        <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}