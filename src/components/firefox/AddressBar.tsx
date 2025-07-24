import React, { useState } from 'react'
import { Shield, Lock, Globe } from 'lucide-react'
import { cn } from '~/lib/utils'

interface AddressBarProps {
  url?: string | undefined
  onNavigate?: ((url: string) => void) | undefined
  showSecurity?: boolean | undefined
  className?: string | undefined
}

export function AddressBar({ 
  url = '', 
  onNavigate,
  showSecurity = true,
  className 
}: AddressBarProps) {
  const [value, setValue] = useState(url)
  const [isFocused, setIsFocused] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNavigate?.(value)
  }
  
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }
  
  const getPath = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.pathname + urlObj.search
    } catch {
      return ''
    }
  }
  
  const domain = getDomain(url)
  const path = getPath(url)
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "bg-[rgba(21,20,26,0.07)] rounded h-8 flex items-center px-0.5 transition-all",
        isFocused && "ring-2 ring-[#0062fa] bg-white",
        className
      )}
    >
      {showSecurity && (
        <div className="flex items-center px-1">
          <button 
            type="button"
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]"
          >
            <Shield className="w-4 h-4 text-green-600" />
          </button>
          <button 
            type="button"
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]"
          >
            <Lock className="w-4 h-4 text-green-600" />
          </button>
          <button 
            type="button"
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {isFocused ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent outline-none text-[15px] font-sans px-2 text-[#15141a]"
          placeholder="Search or enter address"
          autoFocus
        />
      ) : (
        <div
          className="flex-1 px-2 text-[15px] font-sans cursor-text flex items-center"
          onClick={() => {
            setIsFocused(true)
            setValue(url)
          }}
        >
          {url ? (
            <>
              <span className="text-gray-500">www.</span>
              <span className="text-gray-900">{domain}</span>
              <span className="text-gray-500">{path}</span>
            </>
          ) : (
            <span className="text-gray-400">Search or enter address</span>
          )}
        </div>
      )}
      
      <div className="flex items-center px-1">
        <button 
          type="button"
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]"
        >
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <rect x="0.5" y="0.5" width="7" height="9" stroke="currentColor" strokeWidth="1"/>
            <rect x="8.5" y="0.5" width="7" height="9" stroke="currentColor" strokeWidth="1"/>
            <rect x="0.5" y="10.5" width="7" height="9" stroke="currentColor" strokeWidth="1"/>
            <rect x="8.5" y="10.5" width="7" height="9" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </button>
        <button 
          type="button"
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-[rgba(21,20,26,0.07)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l2 6h6l-5 3.5L13 15 8 11.5 3 15l2-4.5L0 7h6L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </form>
  )
}