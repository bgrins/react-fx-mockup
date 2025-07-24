import React from 'react'
import { Heart, Star } from 'lucide-react'
import { cn } from '~/lib/utils'

interface PropertyCardProps {
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
  isFavorite?: boolean
  onFavoriteToggle?: () => void
}

export function PropertyCard({
  title,
  location,
  guests,
  bedrooms,
  beds,
  baths,
  price,
  rating,
  reviews,
  images,
  host,
  isFavorite,
  onFavoriteToggle
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  
  return (
    <div className="group cursor-pointer">
      {/* Image carousel */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
        <img 
          src={images[currentImageIndex]} 
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Image navigation dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentImageIndex 
                    ? "bg-white w-2" 
                    : "bg-white/70"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(index)
                }}
              />
            ))}
          </div>
        )}
        
        {/* Favorite button */}
        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:scale-110 transition-transform"
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle?.()
          }}
        >
          <Heart 
            className={cn(
              "w-6 h-6",
              isFavorite 
                ? "fill-[#FF385C] text-[#FF385C]" 
                : "fill-black/50 text-white stroke-[1.5]"
            )}
          />
        </button>
        
        {/* Guest favorite badge */}
        {rating && rating >= 4.9 && (
          <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full shadow-md">
            <span className="text-xs font-medium">Guest favourite</span>
          </div>
        )}
        
        {/* Show all photos button */}
        <button className="absolute bottom-3 right-3 bg-white text-xs font-medium px-3 py-1.5 rounded-lg border border-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Show all photos
        </button>
      </div>
      
      {/* Property details */}
      <div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-[15px] text-[#222222]">{title}</h3>
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-sm">{rating}</span>
              {reviews && (
                <span className="text-sm text-gray-500">({reviews})</span>
              )}
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-1">{location}</p>
        <p className="text-gray-600 text-sm">
          {guests} guests · {bedrooms} bedroom{bedrooms > 1 ? 's' : ''} · {beds} bed{beds > 1 ? 's' : ''} · {baths} bath{baths > 1 ? 's' : ''}
        </p>
        
        <div className="mt-2 flex items-baseline">
          <span className="font-semibold text-[#222222]">€{price}</span>
          <span className="text-gray-600 text-sm ml-1">night</span>
        </div>
        
        {host && (
          <div className="mt-3 flex items-center gap-2">
            {host.avatar ? (
              <img src={host.avatar} alt={host.name} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300" />
            )}
            <span className="text-xs text-gray-600">Hosted by {host.name}</span>
            {host.isSuperhost && (
              <span className="text-xs text-gray-600">· 4 years on Airbnb</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}