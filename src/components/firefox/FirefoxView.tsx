import React, { useEffect, useState, useCallback } from 'react';
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
  iframeRefs: React.MutableRefObject<{ [key: string]: HTMLIFrameElement | null }>;
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
  iframeRefs
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

  return (
    <div className="h-full bg-[#f9f9fb] overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-700 mb-2">Firefox View</h1>
          <p className="text-gray-500">
            {browsableTabs.length === 0 
              ? 'No other tabs open'
              : `${browsableTabs.length} tab${browsableTabs.length === 1 ? '' : 's'} open`}
          </p>
        </div>

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