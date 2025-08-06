import { cn } from '~/lib/utils';
import type { OpenGraphData } from '~/utils/opengraph';

interface OpenGraphPreviewProps {
  data: OpenGraphData;
  className?: string;
  loading?: boolean;
  error?: string;
  onClose?: () => void;
}

export function OpenGraphPreview({ 
  data, 
  className, 
  loading = false, 
  error,
  onClose 
}: OpenGraphPreviewProps) {
  if (loading) {
    return (
      <div className={cn(
        "bg-white border border-[#cfcfd8] rounded-lg shadow-lg p-4 max-w-sm",
        "animate-pulse",
        className
      )}>
        <div className="flex items-start space-x-3">
          <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded mb-1" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-sm",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <ErrorIcon />
            <span className="text-sm text-red-600">Failed to load preview</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close preview"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  const {
    title,
    description,
    image,
    imageAlt,
    url,
    siteName,
    favicon
  } = data;

  if (!title && !description && !image) {
    return null;
  }

  const displayUrl = url ? new URL(url).hostname : '';

  return (
    <div className={cn(
      "bg-white border border-[#cfcfd8] rounded-lg shadow-lg overflow-hidden max-w-sm",
      "hover:shadow-xl transition-shadow duration-200",
      className
    )}>
      {/* Header with close button */}
      {onClose && (
        <div className="flex justify-end p-2 border-b border-[#cfcfd8]">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
            aria-label="Close preview"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Image section */}
      {image && (
        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
          <img
            src={image}
            alt={imageAlt || title || 'Preview image'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content section */}
      <div className="p-4">
        {/* Site info */}
        <div className="flex items-center space-x-2 mb-2">
          {favicon && (
            <img
              src={favicon}
              alt="Site favicon"
              className="w-4 h-4 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="text-xs text-[#5b5b66] truncate">
            {siteName || displayUrl}
          </span>
        </div>

        {/* Title */}
        {title && (
          <h3 className="font-medium text-[#15141a] text-sm leading-5 mb-2 line-clamp-2">
            {title}
          </h3>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-[#5b5b66] leading-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* URL */}
        {url && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0062fa] hover:underline truncate block"
              title={url}
            >
              {url}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zM8 13.5A1.5 1.5 0 1 1 8 10.5 1.5 1.5 0 0 1 8 13.5zM8 8.5A.5.5 0 0 1 7.5 8V4.5a.5.5 0 0 1 1 0V8A.5.5 0 0 1 8 8.5z"
        fill="#dc2626"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M9 3L3 9M3 3L9 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}