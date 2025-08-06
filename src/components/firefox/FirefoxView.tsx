import React, { useEffect, useState, useCallback, useRef } from 'react';
import { OpenGraphPreview } from './OpenGraphPreview';
import { extractOpenGraphFromHTML } from '~/utils/opengraph';
import { PROXY_MESSAGE_TYPES } from '~/constants/browser';
import type { Tab } from '~/types/browser';
import type { OpenGraphData } from '~/utils/opengraph';

interface FirefoxViewProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNavigate?: (url: string) => void;
  onNewTab?: () => void;
  iframeRefs: React.MutableRefObject<{ [key: string]: HTMLIFrameElement | null }>;
  smartWindowMode?: boolean;
  onSmartWindowToggle?: () => void;
}

interface TabOpenGraphData {
  [tabId: string]: {
    data: OpenGraphData | null;
    loading: boolean;
    error: string | null;
  };
}

export function FirefoxView({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose,
  onNavigate,
  onNewTab,
  iframeRefs,
  smartWindowMode = false,
  onSmartWindowToggle
}: FirefoxViewProps) {
  const [tabOpenGraphData, setTabOpenGraphData] = useState<TabOpenGraphData>({});

  // Filter out system tabs and get only browsable tabs
  const browsableTabs = tabs.filter(tab => 
    !tab.url.startsWith('about:') && 
    tab.url !== 'about:blank' &&
    tab.id !== activeTabId // Don't show the currently active Firefox View tab
  );

  // Store command IDs to map responses back to tabs
  const [commandToTabMap, setCommandToTabMap] = useState<{[key: string]: string}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract OpenGraph data for tabs using proxy tunnel
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === PROXY_MESSAGE_TYPES.RESPONSE && 
          event.data?.command === 'getOuterHTML') {
        const { result, id } = event.data;
        const tabId = commandToTabMap[id];
        
        if (result && tabId) {
          try {
            const ogData = extractOpenGraphFromHTML(result, tabs.find(t => t.id === tabId)?.url);
            setTabOpenGraphData(prev => ({
              ...prev,
              [tabId]: {
                data: ogData,
                loading: false,
                error: null
              }
            }));
          } catch (error) {
            setTabOpenGraphData(prev => ({
              ...prev,
              [tabId]: {
                data: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to extract OpenGraph data'
              }
            }));
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tabs, commandToTabMap]);

  // Send command to specific iframe
  const sendCommandToTab = useCallback((tabId: string, command: string, args: any[] = []) => {
    const iframe = iframeRefs.current[tabId];
    if (!iframe?.contentWindow) {
      console.log(`[FIREFOX VIEW] Cannot send ${command} command to tab ${tabId} - no iframe contentWindow`);
      return;
    }

    const commandId = `cmd-${command}-${tabId}-${Date.now()}`;
    console.log(`[FIREFOX VIEW] Sending ${command} command to tab ${tabId}:`, commandId);

    const message = {
      type: PROXY_MESSAGE_TYPES.COMMAND,
      id: commandId,
      command,
      args,
    };

    console.log(`[FIREFOX VIEW] Posting message to tab iframe:`, message);
    iframe.contentWindow.postMessage(message, "*");
    return commandId;
  }, [iframeRefs]);

  // Request outer HTML for each browsable tab
  useEffect(() => {
    browsableTabs.forEach(tab => {
      // Only fetch if we don't have data yet and tab is not currently active
      if (!tabOpenGraphData[tab.id] && tab.id !== activeTabId) {
        setTabOpenGraphData(prev => ({
          ...prev,
          [tab.id]: {
            data: null,
            loading: true,
            error: null
          }
        }));

        // Request the outer HTML from the tab's iframe
        const commandId = sendCommandToTab(tab.id, 'getOuterHTML');
        if (commandId) {
          setCommandToTabMap(prev => ({
            ...prev,
            [commandId]: tab.id
          }));
        }
      }
    });
  }, [browsableTabs, sendCommandToTab, tabOpenGraphData, activeTabId]);

  // Auto-focus search bar when entering Smart Window mode
  useEffect(() => {
    if (smartWindowMode && searchInputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [smartWindowMode]);

  // Handle search form submission - creates new tab and navigates
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onNewTab && onNavigate) {
      // Check if it looks like a URL
      const isURL = searchQuery.includes('.') || searchQuery.startsWith('http');
      const navigateUrl = isURL 
        ? (searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`)
        : `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`;
      
      // Create new tab first
      onNewTab();
      
      // Navigate to URL after a brief delay to ensure tab is created
      setTimeout(() => {
        onNavigate(navigateUrl);
      }, 10);
      
      setSearchQuery('');
    }
  };

  // Handle navigation from quick actions - also creates new tab
  const handleQuickNavigate = (url: string) => {
    if (onNewTab && onNavigate) {
      onNewTab();
      setTimeout(() => {
        onNavigate(url);
      }, 10);
    }
  };

  return (
    <div className="h-full bg-[#f9f9fb] overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-700 mb-2">
                {smartWindowMode ? 'Smart Window' : 'Firefox View'}
              </h1>
              <p className="text-gray-500">
                {smartWindowMode 
                  ? 'AI-powered browsing with enhanced features and tab management'
                  : browsableTabs.length === 0 
                    ? 'No other tabs open'
                    : `${browsableTabs.length} tab${browsableTabs.length === 1 ? '' : 's'} open`}
              </p>
            </div>
            
            {/* Smart Window Toggle - positioned consistently in both modes */}
            {onSmartWindowToggle && (
              <button
                onClick={onSmartWindowToggle}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                  ${smartWindowMode 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                  }
                `}
              >
                {smartWindowMode ? 'Exit Smart Window' : 'Enable Smart Window'}
              </button>
            )}
          </div>
        </div>

        {/* Centered Search Bar (only in Smart Window mode) */}
        {smartWindowMode && (
          <div className="mb-8 flex justify-center">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search or enter address"
                  className="w-full px-6 py-4 text-lg rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none shadow-sm bg-white"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="submit"
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Search"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Smart Window Features (when in smart mode) */}
        {smartWindowMode && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8A6.5 6.5 0 0 0 8 1.5zM8 12.5A4.5 4.5 0 1 1 12.5 8A4.5 4.5 0 0 1 8 12.5z" fill="#2563eb"/>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Smart Search</h3>
              </div>
              <p className="text-sm text-gray-600">
                Enhanced search with AI-powered suggestions and context understanding
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 2v6h12V5H2z" fill="#16a34a"/>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Tab Intelligence</h3>
              </div>
              <p className="text-sm text-gray-600">
                Automatic tab grouping, preview cards, and intelligent organization
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L9.5 6.5H14L10.5 9.5L12 14L8 11L4 14L5.5 9.5L2 6.5H6.5L8 2z" fill="#7c3aed"/>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">AI Assistant</h3>
              </div>
              <p className="text-sm text-gray-600">
                Built-in AI to help with research, summarization, and web navigation
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions (when in smart mode) */}
        {smartWindowMode && onNavigate && onNewTab && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleQuickNavigate('https://github.com/mozilla-firefox/firefox')}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                🔧 Firefox Source Code
              </button>
              <button
                onClick={() => handleQuickNavigate('https://developer.mozilla.org')}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                📚 MDN Web Docs
              </button>
              <button
                onClick={() => handleQuickNavigate('/link-preview-demo')}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                🔗 OpenGraph Demo
              </button>
            </div>
          </div>
        )}

        {browsableTabs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-gray-300 mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19M17,17H7V15H17V17M17,13H7V11H17V13M17,9H7V7H17V9Z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No other tabs to show</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Open some web pages to see link previews and manage your browsing session.
            </p>
          </div>
        ) : (
          /* Tab Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {browsableTabs.map(tab => {
              const ogData = tabOpenGraphData[tab.id];
              
              return (
                <div key={tab.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Tab Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {/* Favicon */}
                        <div className="flex-shrink-0 w-4 h-4">
                          {tab.favicon || (
                            <div className="w-4 h-4 bg-gray-300 rounded-sm" />
                          )}
                        </div>
                        
                        {/* Title */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {tab.title || 'Loading...'}
                          </h3>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {tab.url}
                          </p>
                        </div>
                      </div>
                      
                      {/* Close Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTabClose(tab.id);
                        }}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </div>

                  {/* OpenGraph Preview */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => onTabClick(tab.id)}
                  >
                    {ogData?.loading ? (
                      <div className="p-4">
                        <div className="animate-pulse space-y-3">
                          <div className="h-32 bg-gray-200 rounded" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ) : ogData?.error ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="text-gray-300 mb-2">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17M12,14A1,1 0 0,1 11,13V7A1,1 0 0,1 12,6A1,1 0 0,1 13,7V13A1,1 0 0,1 12,14Z" />
                          </svg>
                        </div>
                        <p className="text-xs">Preview unavailable</p>
                      </div>
                    ) : ogData?.data && Object.keys(ogData.data).length > 0 ? (
                      <div className="p-4">
                        <OpenGraphPreview 
                          data={ogData.data}
                          loading={false}
                          className="shadow-none border-0 bg-transparent p-0"
                        />
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <div className="text-gray-300 mb-2">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                            <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                          </svg>
                        </div>
                        <p className="text-xs">No preview available</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => onTabClick(tab.id)}
                      className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    >
                      Switch to Tab
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {browsableTabs.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Click on any tab preview to switch to it, or use the close button to close tabs.
            </p>
          </div>
        )}
      </div>
    </div>
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