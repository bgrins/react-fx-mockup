import { ChevronDown } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface ReservationFormProps {
  price: number
  currency?: string
  onReserve?: () => void
}

export function ReservationForm({ 
  price, 
  currency = '€',
  onReserve 
}: ReservationFormProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
      <div className="flex items-baseline mb-4">
        <span className="text-2xl font-semibold">{currency}{price}</span>
        <span className="text-gray-600 ml-1">night</span>
      </div>
      
      <div className="border border-gray-300 rounded-lg mb-4">
        <div className="grid grid-cols-2 divide-x divide-gray-300">
          <div className="p-3">
            <label className="text-xs font-medium uppercase tracking-wide">Check-in</label>
            <div className="text-sm mt-1">8/12/2025</div>
          </div>
          <div className="p-3">
            <label className="text-xs font-medium uppercase tracking-wide">Checkout</label>
            <div className="text-sm mt-1">8/21/2025</div>
          </div>
        </div>
        <div className="border-t border-gray-300 p-3">
          <label className="text-xs font-medium uppercase tracking-wide">Guests</label>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm">2 guests</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
      
      <Button 
        className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white py-3 text-base font-medium"
        onClick={onReserve}
      >
        Reserve
      </Button>
      
      <p className="text-center text-sm text-gray-500 mt-3">
        You won't be charged yet
      </p>
      
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="underline">{currency}{price} × 9 nights</span>
          <span>{currency}{price * 9}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="underline">Cleaning fee</span>
          <span>{currency}50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="underline">Airbnb service fee</span>
          <span>{currency}120</span>
        </div>
        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Total</span>
          <span>{currency}{price * 9 + 50 + 120}</span>
        </div>
      </div>
    </div>
  )
}