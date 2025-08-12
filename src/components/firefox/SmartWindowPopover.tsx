import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { SparklesIcon, WindowIcon, CheckIcon } from '~/components/icons'
import { cn } from '~/lib/utils'

interface SmartWindowPopoverProps {
  smartWindowMode: boolean
  onSmartWindowToggle: () => void
}

export function SmartWindowPopover({ 
  smartWindowMode, 
  onSmartWindowToggle 
}: SmartWindowPopoverProps) {
  const [open, setOpen] = React.useState(false)

  const handleModeSelect = (mode: 'classic' | 'smart') => {
    if ((mode === 'classic' && smartWindowMode) || (mode === 'smart' && !smartWindowMode)) {
      onSmartWindowToggle()
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative w-8 h-8 flex items-center justify-center rounded-lg mr-2",
            "bg-white/60 border border-gray-300/50",
            "hover:bg-white/80 transition-all duration-200",
            "shadow-sm"
          )}
          title={smartWindowMode ? "Smart Window Mode" : "Classic Mode"}
        >
          {smartWindowMode ? (
            <div className="relative">
              <SparklesIcon />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
            </div>
          ) : (
            <WindowIcon />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-48 p-1 bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col">
          <button
            onClick={() => handleModeSelect('classic')}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded text-sm",
              "hover:bg-gray-100/50 transition-colors",
              !smartWindowMode && "bg-blue-50"
            )}
          >
            <div className="flex items-center gap-2">
              <WindowIcon />
              <span className="font-medium">Classic</span>
            </div>
            {!smartWindowMode && <CheckIcon />}
          </button>
          <button
            onClick={() => handleModeSelect('smart')}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded text-sm",
              "hover:bg-gray-100/50 transition-colors",
              smartWindowMode && "bg-orange-50"
            )}
          >
            <div className="flex items-center gap-2">
              <SparklesIcon />
              <span className="font-medium">Smart</span>
            </div>
            {smartWindowMode && <CheckIcon />}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}