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
  onSmartWindowToggle?: () => void
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
  },
  {
    id: 'firefox-github',
    title: 'Firefox GitHub',
    url: 'https://github.com/mozilla-firefox/firefox',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg'
  }
]

export function NewTabPage({ onNavigate, onSmartWindowToggle }: NewTabPageProps) {
  const handleTileClick = (url: string) => {
    onNavigate?.(url)
  }

  return (
    <div className="flex items-center justify-center h-full bg-[#f9f9fb] p-8 relative" data-testid="new-tab-page">
      {onSmartWindowToggle && (
        <div className="absolute top-8 right-8">
          <button
            onClick={onSmartWindowToggle}
            className={cn(
              "px-6 py-3 bg-[#0060df] hover:bg-[#0050bb] text-white",
              "rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
              "font-medium text-sm flex items-center gap-2"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-90">
              <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2H2V3zm0 4h12v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7zm9 2a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/>
            </svg>
            Switch to Smart Window
          </button>
        </div>
      )}
      <div className="max-w-6xl mx-auto w-full">
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {defaultTiles.map((tile) => (
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