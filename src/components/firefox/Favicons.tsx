
export function SkyscannerFavicon() {
  return (
    <div className="w-4 h-4 rounded overflow-hidden bg-[#0770E3]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm3.5 6.5h-3v3h-1v-3h-3v-1h3v-3h1v3h3v1z" fill="white"/>
      </svg>
    </div>
  )
}

export function YouTubeFavicon() {
  return (
    <div className="w-4 h-4 rounded overflow-hidden">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect width="16" height="16" fill="#FF0000"/>
        <path d="M6.4 5.6v4.8L10.4 8 6.4 5.6z" fill="white"/>
      </svg>
    </div>
  )
}

export function TripAdvisorFavicon() {
  return (
    <div className="w-4 h-4 rounded overflow-hidden bg-[#00AF87]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="8" r="2" fill="white"/>
        <circle cx="11" cy="8" r="2" fill="white"/>
        <circle cx="5" cy="8" r="1" fill="#00AF87"/>
        <circle cx="11" cy="8" r="1" fill="#00AF87"/>
        <path d="M8 4c-2.5 0-4.5 1.5-5.5 3 1 1.5 3 3 5.5 3s4.5-1.5 5.5-3c-1-1.5-3-3-5.5-3z" stroke="white" strokeWidth="1.5" fill="none"/>
      </svg>
    </div>
  )
}

export function FirefoxFavicon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#FF9500"/>
      <path d="M8 3c2.8 0 5 2.2 5 5s-2.2 5-5 5c-1.4 0-2.7-.6-3.6-1.5.2.1.5.1.7.1 1.7 0 3-1.3 3-3 0-.8-.3-1.5-.8-2.1.5.3.8.8.8 1.4 0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6c0-1.8 1.5-3.3 3.3-3.3.5 0 1 .1 1.4.3-.7-.9-1.8-1.4-3-1.4-2.2 0-4 1.8-4 4 0 .7.2 1.3.5 1.9C3.4 9.8 3 9.4 3 8c0-2.8 2.2-5 5-5z" fill="#FF5722"/>
    </svg>
  )
}

export function FirefoxViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="Shape">
        <path d="M4 1.5C3.72421 1.5 3.5 1.72421 3.5 2H2C2 0.895786 2.89579 0 4 0H12C13.1042 0 14 0.895786 14 2H12.5C12.5 1.72421 12.2758 1.5 12 1.5H4Z" fill="#5B5B66"/>
        <path d="M6 7.5H10V9H6V7.5Z" fill="#5B5B66"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M2 3.5C0.895786 3.5 0 4.39579 0 5.5V13.5C0 14.6042 0.895786 15.5 2 15.5H14C15.1042 15.5 16 14.6042 16 13.5V5.5C16 4.39579 15.1042 3.5 14 3.5H2ZM1.5 5.5C1.5 5.22421 1.72421 5 2 5H14C14.2758 5 14.5 5.22421 14.5 5.5V13.5C14.5 13.7758 14.2758 14 14 14H2C1.72421 14 1.5 13.7758 1.5 13.5V5.5Z" fill="#5B5B66"/>
      </g>
    </svg>
  )
}

export function SparklyFirefoxViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0060df" stopOpacity="1" />
          <stop offset="50%" stopColor="#7c4dff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff6b6b" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g id="Shape">
        <path d="M4 1.5C3.72421 1.5 3.5 1.72421 3.5 2H2C2 0.895786 2.89579 0 4 0H12C13.1042 0 14 0.895786 14 2H12.5C12.5 1.72421 12.2758 1.5 12 1.5H4Z" fill="url(#sparkleGradient)"/>
        <path d="M6 7.5H10V9H6V7.5Z" fill="url(#sparkleGradient)"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M2 3.5C0.895786 3.5 0 4.39579 0 5.5V13.5C0 14.6042 0.895786 15.5 2 15.5H14C15.1042 15.5 16 14.6042 16 13.5V5.5C16 4.39579 15.1042 3.5 14 3.5H2ZM1.5 5.5C1.5 5.22421 1.72421 5 2 5H14C14.2758 5 14.5 5.22421 14.5 5.5V13.5C14.5 13.7758 14.2758 14 14 14H2C1.72421 14 1.5 13.7758 1.5 13.5V5.5Z" fill="url(#sparkleGradient)"/>
      </g>
      {/* Sparkle effects */}
      <circle cx="2" cy="2" r="0.5" fill="#ffd700" opacity="0.8">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="14" cy="3" r="0.3" fill="#ffd700" opacity="0.6">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="13" r="0.4" fill="#ffd700" opacity="0.7">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="3" cy="13" r="0.25" fill="#ffd700" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  )
}

export { DynamicFavicon } from './DynamicFavicon';