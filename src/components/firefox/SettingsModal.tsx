import React, { useState } from "react";
import type { Platform } from "~/types/browser";
import { getMockupShortcuts, formatShortcut, shortcutCategories } from "~/lib/keyboard-shortcuts";
import { useDebug } from "~/contexts/useDebug";
import { useProfile } from "~/hooks/useProfile";
import { Link } from "@tanstack/react-router";
import {SettingsTool} from "~/components/assistant-ui/settings-tool";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [accessKey, setAccessKey] = useState(
    typeof window !== "undefined" ? localStorage.getItem("infer-access-key") || "" : ""
  );
  const { debugInfo } = useDebug();
  const { selectedProfile, selectProfile, availableProfiles } = useProfile();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    states: true,
    shortcuts: true,
    system: true,
  });

  // Handle Esc key to close modal
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Get platform
  const platform: Platform = navigator.platform.toLowerCase().includes("mac") ? "macOS" : 
                           navigator.platform.toLowerCase().includes("win") ? "windows" : "linux";

  const shortcuts = getMockupShortcuts();

  const handleAccessKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("infer-access-key", accessKey);
    // Reload to apply the new key
    window.location.reload();
  };

  const states = [
    { id: "default", label: "Default", description: "Fresh browser state", link: "/" },
    { id: "split", label: "Split View", description: "Two tabs side by side", link: "/split-view" },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-[60px] z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Settings & Help</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Starting States */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Starting States</h3>
                <div className="grid grid-cols-2 gap-4">
                  {states.map((state) => (
                    <Link
                      key={state.id}
                      to={state.link}
                      onClick={onClose}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
                    >
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                        {state.label}
                      </h4>
                      <p className="text-sm text-gray-600">{state.description}</p>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Access Key Configuration */}
              <section className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Infer Access Key</h3>
                <form onSubmit={handleAccessKeySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="access-key" className="block text-sm font-medium text-gray-700 mb-2">
                      Access Key
                    </label>
                    <div className="flex gap-3">
                      <input
                        id="access-key"
                        type="password"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder="Enter your Infer access key"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("infer-access-key");
                          setAccessKey("");
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Used for authentication with the Infer service for enhanced AI-powered features.
                    </p>
                  </div>
                </form>
              </section>

              {/* Profile Selection */}
              <section className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h3>
                <div className="flex items-center gap-4">
                  <label htmlFor="profile-select" className="text-sm font-medium text-gray-700">
                    Select Profile:
                  </label>
                  <select
                    id="profile-select"
                    value={selectedProfile?.name || ""}
                    onChange={(e) => selectProfile(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableProfiles.map((profileName) => (
                      <option key={profileName} value={profileName}>
                        {profileName === "Default" ? "Default" : `${profileName}'s Profile`}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Keyboard Shortcuts */}
              <section className="border-t border-gray-200 pt-8">
                <button
                  onClick={() => toggleSection('shortcuts')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.shortcuts ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedSections.shortcuts && (
                  <div className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {shortcutCategories.slice(0, 4).map((category) => (
                        <div key={category.name}>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{category.name}</h4>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                            {category.shortcuts.map((id) => {
                              const shortcut = shortcuts[id];
                              if (!shortcut) return null;
                              
                              return (
                                <div key={id} className="flex items-center justify-between py-1">
                                  <span className="text-sm text-gray-600">{shortcut.name}</span>
                                  <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-700 bg-gray-200 border border-gray-300 rounded">
                                    {formatShortcut(shortcut, platform)}
                                  </kbd>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {shortcutCategories.slice(4).map((category) => (
                        <div key={category.name}>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{category.name}</h4>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                            {category.shortcuts.map((id) => {
                              const shortcut = shortcuts[id];
                              if (!shortcut) return null;
                              
                              return (
                                <div key={id} className="flex items-center justify-between py-1">
                                  <span className="text-sm text-gray-600">{shortcut.name}</span>
                                  <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-700 bg-gray-200 border border-gray-300 rounded">
                                    {formatShortcut(shortcut, platform)}
                                  </kbd>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> Some shortcuts use Alt instead of Ctrl/Cmd to avoid conflicts with browser shortcuts.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* System Diagnostics */}
              <section className="border-t border-gray-200 pt-8">
                <button
                  onClick={() => toggleSection('system')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">System Diagnostics</h3>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.system ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedSections.system && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">System Information</h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Platform</dt>
                          <dd className="font-medium text-gray-900">{platform}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Screen</dt>
                          <dd className="font-medium text-gray-900">{window.screen.width} × {window.screen.height}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Window</dt>
                          <dd className="font-medium text-gray-900">{window.innerWidth} × {window.innerHeight}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Browser</dt>
                          <dd className="font-medium text-gray-900">
                            {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                             navigator.userAgent.includes('Firefox') ? 'Firefox' :
                             navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {debugInfo && debugInfo.currentTab && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Tab Debug Info</h4>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-gray-500">Type</dt>
                            <dd className="font-mono text-gray-900">{debugInfo.currentTab.type}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">URL</dt>
                            <dd className="font-mono text-gray-900 break-all">{debugInfo.currentTab.url}</dd>
                          </div>
                          {debugInfo.currentTab.proxyUrl && (
                            <div>
                              <dt className="text-gray-500">Proxy URL</dt>
                              <dd className="font-mono text-gray-900 break-all">{debugInfo.currentTab.proxyUrl}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Browser Features</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Local Storage</span>
                          <span className="font-medium">{typeof Storage !== 'undefined' ? '✓' : '✗'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Service Workers</span>
                          <span className="font-medium">{'serviceWorker' in navigator ? '✓' : '✗'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">WebGL</span>
                          <span className="font-medium">{!!window.WebGLRenderingContext ? '✓' : '✗'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Cookies</span>
                          <span className="font-medium">{navigator.cookieEnabled ? '✓' : '✗'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <SettingsTool />
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}