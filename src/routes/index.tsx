import { createFileRoute } from '@tanstack/react-router'
import { BrowserShell } from '~/components/firefox/BrowserShell'
import { SplitView } from '~/components/airbnb/SplitView'
import { AirbnbFavicon, SkyscannerFavicon, YouTubeFavicon, FirefoxFavicon } from '~/components/firefox/Favicons'
import { mockProperties } from '~/data/mockProperties'
import React from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [activeTabId, setActiveTabId] = React.useState('airbnb-2')
  
  const tabs = [
    {
      id: 'firefox',
      title: 'Firefox View',
      url: 'about:firefoxview',
      favicon: <FirefoxFavicon />,
      isPinned: true
    },
    {
      id: 'skyscanner',
      title: 'Skyscanner: Compare Cheap Flights & Book Airline Tickets to ...',
      url: 'https://www.skyscanner.com',
      favicon: <SkyscannerFavicon />
    },
    {
      id: 'airbnb-1',
      title: 'Villa il Vecchio courtyard "pergola" - Villas for Rent in Rodos, Greece - Airbnb',
      url: 'https://www.airbnb.com/rooms/1370154278151273293',
      favicon: <AirbnbFavicon />
    },
    {
      id: 'airbnb-2',
      title: 'Saint George Studio - Cottages for Rent in Psinthos, Greece - Airbnb',
      url: 'https://www.airbnb.com/rooms/1370154278151273293',
      favicon: <AirbnbFavicon />,
      isActive: true
    },
    {
      id: 'youtube',
      title: 'Cheap flights from Toronto to Tokyo | Skyscanner',
      url: 'https://www.youtube.com',
      favicon: <YouTubeFavicon />
    }
  ]
  
  const activeTab = tabs.find(tab => tab.id === activeTabId)
  
  return (
    <div className="h-[calc(100vh-60px)] bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-4 lg:p-6 overflow-hidden">
      <div className="h-full max-w-[1600px] mx-auto flex flex-col">
        <BrowserShell
          tabs={tabs}
          activeTabId={activeTabId}
          currentUrl={activeTab?.url || ''}
          onTabClick={setActiveTabId}
          onTabClose={(id) => console.log('Close tab:', id)}
          onNewTab={() => console.log('New tab')}
          onNavigate={(url) => console.log('Navigate to:', url)}
          className="flex-1 min-h-0"
        >
        {activeTabId.startsWith('airbnb') && (
          <SplitView
            leftProperty={mockProperties.villaRodos}
            rightProperty={mockProperties.saintGeorgeStudio}
          />
        )}
        {activeTabId === 'skyscanner' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Skyscanner content would go here</p>
          </div>
        )}
        {activeTabId === 'youtube' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>YouTube content would go here</p>
          </div>
        )}
        {activeTabId === 'firefox' && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Firefox View content would go here</p>
          </div>
        )}
        </BrowserShell>
      </div>
    </div>
  )
}
