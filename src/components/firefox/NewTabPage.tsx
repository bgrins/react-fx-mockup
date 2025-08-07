import { cn } from '~/lib/utils'
import { defaultShortcuts } from '~/constants/shortcuts'

interface NewTabPageProps {
  onNavigate?: (url: string) => void
}

export function NewTabPage({ onNavigate }: NewTabPageProps) {
  const handleTileClick = (url: string) => {
    onNavigate?.(url)
  }

  return (
    <div className="flex items-center justify-center h-full bg-[#f9f9fb] p-8 relative" data-testid="new-tab-page">
      <div className="max-w-6xl mx-auto w-full">
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {defaultShortcuts.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.url)}
              className={cn(
                "group relative flex flex-col items-center justify-center p-3 w-[110px] h-[110px]",
                "bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200",
                "border border-gray-200 hover:border-gray-400",
                "cursor-pointer"
              )}
            >
              <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-lg overflow-hidden bg-gray-50">
                {tile.favicon ? (
                  <img 
                    src={tile.favicon} 
                    alt={tile.title}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={cn(
                  "w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-2xl font-bold",
                  tile.favicon ? "hidden" : ""
                )}>
                  {tile.title.charAt(0).toUpperCase()}
                </div>
              </div>
              <span className="text-xs text-gray-700 font-medium truncate w-full text-center px-1">
                {tile.title}
              </span>
            </button>
          ))}
        </div>
        
        <div className="text-center text-gray-500">
          <p className="text-sm">Start browsing or enter a URL in the address bar</p>
        </div>
      </div>
    </div>
  )
}