import React from 'react'
import { useProfile } from '~/hooks/useProfile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function ProfileSwitcher() {
  const { availableProfiles, selectedProfile, selectProfile } = useProfile()

  const getProfileDisplayName = (profileName: string) => {
    if (profileName === 'Default') return 'Default'
    return `${profileName}'s Profile`
  }

  const getProfileInitial = (profileName: string) => {
    return profileName.charAt(0).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 px-3 flex items-center gap-2 rounded hover:bg-[rgba(21,20,26,0.07)] text-sm font-medium"
          title={`Current profile: ${getProfileDisplayName(selectedProfile?.name || 'Default')}`}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {getProfileInitial(selectedProfile?.name || 'Default')}
          </div>
          <ChevronDownIcon />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
          Switch Profile
        </div>
        {availableProfiles.map((profileName, index) => (
          <React.Fragment key={profileName}>
            <DropdownMenuItem
              onClick={() => selectProfile(profileName)}
              className={`flex items-center gap-3 py-2 ${
                selectedProfile?.name === profileName
                  ? 'bg-blue-50 text-blue-700'
                  : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                profileName === 'Default'
                  ? 'bg-gray-500'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                {getProfileInitial(profileName)}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                  {getProfileDisplayName(profileName)}
                </span>
                {selectedProfile?.name === profileName && (
                  <span className="text-xs text-blue-600">Current</span>
                )}
              </div>
              {selectedProfile?.name === profileName && (
                <div className="ml-auto">
                  <CheckIcon />
                </div>
              )}
            </DropdownMenuItem>
            {index === 0 && availableProfiles.length > 1 && (
              <DropdownMenuSeparator />
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500">
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 4.5L6 12L2.5 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-600"
      />
    </svg>
  )
}