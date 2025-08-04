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
    id: 'example',
    title: 'Example',
    url: 'https://example.com',
    favicon: '/default-favicon.svg'
  },
  {
    id: 'npr',
    title: 'NPR Text',
    url: 'https://text.npr.org',
    favicon: 'https://text.npr.org/favicon.ico'
  },
  {
    id: 'espn',
    title: 'ESPN',
    url: 'https://www.espn.com',
    favicon: 'https://a.espncdn.com/favicon.ico'
  },
  {
    id: 'wikipedia',
    title: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Main_Page',
    favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico'
  },
  {
    id: 'mozilla',
    title: 'Mozilla',
    url: 'https://www.mozilla.org',
    favicon: 'https://www.mozilla.org/media/img/favicons/mozilla/favicon-196x196.png'
  },
  {
    id: 'firefox',
    title: 'Firefox',
    url: 'https://www.firefox.com',
    favicon: 'https://www.mozilla.org/media/img/favicons/firefox/browser/favicon-196x196.png'
  },
  {
    id: 'firefox-wiki',
    title: 'Firefox Wiki',
    url: '/pages/firefox-wiki.html',
    favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico'
  },
  {
    id: 'test-page',
    title: 'Test Page',
    url: '/test-page.html',
    favicon: '/default-favicon.svg'
  },
  {
    id: 'villa-il-vecchio',
    title: 'Villa Il Vecchio',
    url: '/pages/villa-il-vecchio.html',
    favicon: 'https://www.airbnb.com/favicon.ico'
  },
  {
    id: 'st-george',
    title: 'St. George',
    url: '/pages/st-george.html',
    favicon: 'https://www.airbnb.com/favicon.ico'
  }
]

export function NewTabPage({ onNavigate }: NewTabPageProps) {
  const handleTileClick = (url: string) => {
    onNavigate?.(url)
  }

  return (
    <div className="flex items-center justify-center h-full bg-[#f9f9fb] p-8" data-testid="new-tab-page">
      <div className="max-w-4xl w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8 max-w-5xl mx-auto">
          {defaultTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.url)}
              className={cn(
                "group relative flex flex-col items-center justify-center p-3 h-[110px]",
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