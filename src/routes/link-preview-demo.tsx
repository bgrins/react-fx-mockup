import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { OpenGraphPreview } from "~/components/firefox/OpenGraphPreview";
import { useOpenGraph } from "~/hooks/useOpenGraph";

export const Route = createFileRoute("/link-preview-demo")({
  component: LinkPreviewDemo,
});

function LinkPreviewDemo() {
  const [inputUrl, setInputUrl] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data, loading, error, fetchOpenGraph, clear } = useOpenGraph(testUrl, {
    useProxy: true,
    debounceMs: 500,
    autoFetch: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setTestUrl(inputUrl.trim());
      setShowPreview(true);
      fetchOpenGraph(inputUrl.trim());
    }
  };

  const handleClear = () => {
    setInputUrl("");
    setTestUrl("");
    setShowPreview(false);
    clear();
  };

  const sampleUrls = [
    "https://github.com/anthropics/claude-code",
    "https://docs.anthropic.com/en/docs/claude-code",
    "https://news.ycombinator.com",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta",
    "https://www.npmjs.com/package/happy-dom",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">OpenGraph Link Preview Demo</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test OpenGraph metadata extraction using happy-dom in the parent process with proxy
            tunnel support. Enter any URL to see a Firefox-style link preview card.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="url-input" className="block text-sm font-semibold text-gray-700 mb-3">
                Enter URL to extract OpenGraph data:
              </label>
              <div className="flex gap-3">
                <input
                  id="url-input"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <button
                  type="submit"
                  disabled={!inputUrl.trim() || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? "Loading..." : "Extract"}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          {/* Sample URLs */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Try these sample URLs:</h3>
            <div className="flex flex-wrap gap-3">
              {sampleUrls.map((url) => (
                <button
                  key={url}
                  onClick={() => {
                    setInputUrl(url);
                    setTestUrl(url);
                    setShowPreview(true);
                    fetchOpenGraph(url);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-medium"
                >
                  {new URL(url).hostname}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Card */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Firefox-Style Preview Card</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[300px] flex items-center justify-center">
              {showPreview ? (
                <OpenGraphPreview
                  data={data || {}}
                  loading={loading}
                  error={error || undefined}
                  onClose={() => setShowPreview(false)}
                />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-gray-300 mb-4">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mx-auto"
                    >
                      <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">No preview yet</p>
                  <p className="text-sm">Enter a URL above to see the OpenGraph preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Raw Data */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Extracted Metadata</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[300px]">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg">
                  <strong className="font-semibold">Error:</strong> {error}
                </div>
              ) : data && Object.keys(data).length > 0 ? (
                <div>
                  <div className="mb-4">
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {Object.keys(data).length} fields extracted
                    </span>
                  </div>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-80 bg-gray-50 p-4 rounded-lg border font-mono">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ) : showPreview ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-lg font-medium mb-2">No metadata found</p>
                  <p className="text-sm">This URL does not contain OpenGraph metadata</p>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-gray-300 mb-4">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mx-auto"
                    >
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L18,9.5L16.5,8L11,13.5L7.5,10L6,11.5L11,16.5Z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">Raw data will appear here</p>
                  <p className="text-sm">JSON format of all extracted OpenGraph metadata</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-blue-900 mb-6">🔧 Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">Core Technologies:</h4>
              <ul className="text-blue-700 space-y-2">
                <li>
                  • <strong>happy-dom:</strong> Server-side DOM parsing
                </li>
                <li>
                  • <strong>Proxy Tunnel:</strong> CORS bypass for external URLs
                </li>
                <li>
                  • <strong>Parent Process:</strong> Extraction in main thread
                </li>
                <li>
                  • <strong>TypeScript:</strong> Full type safety
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">Features:</h4>
              <ul className="text-blue-700 space-y-2">
                <li>
                  • <strong>Debounced Fetching:</strong> Prevents spam requests
                </li>
                <li>
                  • <strong>Error Handling:</strong> Graceful failure recovery
                </li>
                <li>
                  • <strong>Firefox UI:</strong> Authentic browser styling
                </li>
                <li>
                  • <strong>Responsive:</strong> Works on all screen sizes
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-8">
          <h3 className="text-xl font-bold text-amber-900 mb-4">📋 How to Use</h3>
          <ol className="text-amber-800 space-y-2 text-sm">
            <li>
              <strong>1.</strong> Enter any valid URL in the input field above
            </li>
            <li>
              <strong>2.</strong> Click &quot;Extract&quot; or press Enter to fetch metadata
            </li>
            <li>
              <strong>3.</strong> View the Firefox-style preview card on the left
            </li>
            <li>
              <strong>4.</strong> Examine the raw extracted data on the right
            </li>
            <li>
              <strong>5.</strong> Try the sample URLs for quick testing
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
