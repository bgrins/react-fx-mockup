import React from 'react'
import { cn } from '~/lib/utils'

interface Tile {
  id: string
  title: string
  url: string
  icon?: React.ReactNode
  favicon?: string
}

interface NewTabPageProps {
  onNavigate?: (url: string) => void
}

const defaultTiles: Tile[] = [
  {
    id: 'wikipedia',
    title: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Main_Page',
    favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico'
  },
  {
    id: 'mozilla',
    title: 'Mozilla',
    url: 'https://mozilla.org',
    favicon: 'https://www.mozilla.org/media/img/favicons/mozilla/favicon-196x196.png'
  },
  {
    id: 'firefox',
    title: 'Firefox',
    url: 'https://firefox.com',
    favicon: 'https://www.mozilla.org/media/img/favicons/firefox/browser/favicon-196x196.png'
  }
]

export function NewTabPage({ onNavigate }: NewTabPageProps) {
  const handleTileClick = (url: string) => {
    onNavigate?.(url)
  }

  return (
    <div className="flex items-center justify-center h-full bg-[#f9f9fb] p-8">
      <div className="max-w-4xl w-full">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {defaultTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.url)}
              className={cn(
                "group relative flex flex-col items-center justify-center p-4 h-[120px]",
                "bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
                "border border-gray-200 hover:border-gray-300",
                "cursor-pointer"
              )}
            >
              <div className="w-16 h-16 mb-2 flex items-center justify-center">
                {tile.favicon ? (
                  <img 
                    src={tile.favicon} 
                    alt={tile.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={cn(
                  "w-full h-full bg-gray-300 rounded",
                  tile.favicon ? "hidden" : ""
                )} />
              </div>
              <span className="text-sm text-gray-700 font-medium">
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