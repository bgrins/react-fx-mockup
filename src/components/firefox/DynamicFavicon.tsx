import React from 'react';

interface DynamicFaviconProps {
  url: string;
  size?: number;
  fallback?: React.ReactNode;
}

export function DynamicFavicon({ url, size = 16, fallback }: DynamicFaviconProps) {
  const [hasError, setHasError] = React.useState(false);
  
  // Extract domain from URL
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  };
  
  const domain = getDomain(url);
  const googleFaviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}` : '';
  
  if (!domain || hasError) {
    return fallback || <DefaultFavicon />;
  }
  
  return (
    <img 
      src={googleFaviconUrl}
      alt=""
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className="flex-shrink-0"
    />
  );
}

function DefaultFavicon() {
  return (
    <div className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="4" stroke="#666" strokeWidth="1" fill="none"/>
      </svg>
    </div>
  );
}