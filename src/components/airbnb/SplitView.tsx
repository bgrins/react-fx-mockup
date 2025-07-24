import { PropertyCard } from './PropertyCard'
import { ReservationForm } from './ReservationForm'
import { AirbnbFavicon } from '../firefox/Favicons'

interface Property {
  id: string
  title: string
  location: string
  guests: number
  bedrooms: number
  beds: number
  baths: number
  price: number
  rating?: number
  reviews?: number
  images: string[]
  host?: {
    name: string
    avatar?: string
    isSuperhost?: boolean
  }
}

interface SplitViewProps {
  leftProperty: Property
  rightProperty: Property
}

export function SplitView({ leftProperty, rightProperty }: SplitViewProps) {
  return (
    <div className="flex h-full gap-1 p-1 bg-gray-100">
      {/* Left panel */}
      <div className="w-1/2 bg-white rounded-lg overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <PropertyCard {...leftProperty} />
          </div>
        </div>
      </div>
      
      {/* Right panel */}
      <div className="w-1/2 bg-white rounded-lg overflow-hidden relative">
        {/* Domain indicator */}
        <div className="absolute bottom-4 right-4 bg-[#f0f0f4] rounded-tl-lg rounded-br-lg px-2 py-1 flex items-center gap-2 shadow-sm z-10">
          <AirbnbFavicon />
          <span className="text-[13px] font-sans text-[#15141a]">airbnb.com</span>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]">
            <svg width="14" height="3" viewBox="0 0 14 3" fill="none">
              <circle cx="2" cy="1.5" r="1.25" fill="currentColor"/>
              <circle cx="7" cy="1.5" r="1.25" fill="currentColor"/>
              <circle cx="12" cy="1.5" r="1.25" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <div className="h-full overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-[1fr,360px] gap-8">
            <div>
              <PropertyCard {...rightProperty} />
              
              {/* Property details section */}
              <div className="mt-8 border-t pt-8">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={rightProperty.host?.avatar || ''} 
                    alt={rightProperty.host?.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">Hosted by {rightProperty.host?.name}</h3>
                    <p className="text-sm text-gray-500">4 years on Airbnb</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">About this place</h4>
                    <p className="text-gray-600">
                      Experience the charm of traditional Greek architecture in this beautiful cottage. 
                      Located in the heart of Psinthos, you'll be surrounded by authentic local culture 
                      while enjoying modern comforts.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">What this place offers</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                        <span className="text-sm">Wifi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm">Kitchen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">Free parking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">TV</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky top-8">
              <ReservationForm price={rightProperty.price} />
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}