/// <reference types="vite/client" />
import { HeadContent, Link, Scripts, createRootRoute } from "@tanstack/react-router";
import * as React from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import { SettingsIcon } from "~/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useLocation } from "@tanstack/react-router";
import { proxyToUrl } from "~/utils/proxy";
import { DebugProvider, useDebug } from "~/contexts/DebugContext";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1",
      },
      ...seo({
        title: "Firefox UI Mockup",
        description: `Interactive mockup of the Firefox browser UI.`,
        image: "/firefox.svg",
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/firefox.svg",
      },
    ],
    scripts: [
      {
        src: "/customScript.js",
        type: "text/javascript",
      },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: (props) => (
    <DebugProvider>
      <RootDocument {...props} />
    </DebugProvider>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }): React.ReactElement {
  const [accessKey, setAccessKey] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const location = useLocation();
  const { debugInfo } = useDebug();

  React.useEffect(() => {
    // First check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlAccessKey = urlParams.get("accessKey") || urlParams.get("access-key");

    if (urlAccessKey) {
      setAccessKey(urlAccessKey);
      localStorage.setItem("infer-access-key", urlAccessKey);
    } else {
      // Then check localStorage
      const stored = localStorage.getItem("infer-access-key");
      if (stored) {
        setAccessKey(stored);
      } else if (import.meta.env.VITE_INFER_ACCESS_KEY) {
        // If no stored value, use env variable in development
        const envKey = import.meta.env.VITE_INFER_ACCESS_KEY;
        setAccessKey(envKey);
        localStorage.setItem("infer-access-key", envKey);
      }
    }
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+? (Alt+Shift+/)
      if (e.altKey && e.shiftKey && e.key === "?") {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAccessKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccessKey(value);
    if (value) {
      localStorage.setItem("infer-access-key", value);
    } else {
      localStorage.removeItem("infer-access-key");
    }
  };

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden">
        <div id="mockup-manager-toolbar" className="p-2 flex gap-2 text-lg items-center">
          <img src="/firefox.svg" alt="Firefox" width="24" height="24" className="mr-2" />
          <span className="font-semibold text-gray-700">Firefox Mockup</span>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <Link
            to="/"
            activeProps={{
              className: "font-bold",
            }}
            activeOptions={{ exact: true }}
          >
            Browser
          </Link>
          <Link
            to="/split-view"
            activeProps={{
              className: "font-bold",
            }}
          >
            Split View
          </Link>
          <Link
            to="/infer-test"
            activeProps={{
              className: "font-bold",
            }}
          >
            Infer Test
          </Link>
          <div className="ml-auto">
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-md" title="Settings (Alt+?)">
                  <SettingsIcon />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Settings & Debug Info</h3>
                    <span className="text-xs text-gray-500">Alt+?</span>
                  </div>

                  {/* Debug Info Section */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-xs font-medium text-gray-700">Debug Information</h4>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="font-medium text-gray-600">Current Route:</span>{" "}
                        <code className="bg-gray-200 px-1 rounded">{location.pathname}</code>
                      </div>

                      {debugInfo.currentTab && (
                        <>
                          <div className="text-xs">
                            <span className="font-medium text-gray-600">Tab Type:</span>{" "}
                            <code className="bg-gray-200 px-1 rounded">
                              {debugInfo.currentTab.type || "none"}
                            </code>
                          </div>

                          <div className="text-xs">
                            <span className="font-medium text-gray-600">Tab URL:</span>{" "}
                            <code className="bg-gray-200 px-1 rounded text-xs break-all">
                              {debugInfo.currentTab.url || "about:blank"}
                            </code>
                          </div>

                          {debugInfo.currentTab.type === "proxy" &&
                            debugInfo.currentTab.url !== "about:blank" && (
                              <>
                                <div className="text-xs">
                                  <span className="font-medium text-gray-600">Proxy URL:</span>{" "}
                                  <code className="bg-gray-200 px-1 rounded text-xs break-all">
                                    {debugInfo.currentTab.proxyUrl}
                                  </code>
                                </div>

                                <div className="text-xs">
                                  <span className="font-medium text-gray-600">Real URL:</span>{" "}
                                  <code className="bg-gray-200 px-1 rounded text-xs break-all">
                                    {proxyToUrl(debugInfo.currentTab.proxyUrl || "")}
                                  </code>
                                </div>
                              </>
                            )}
                        </>
                      )}

                      {!debugInfo.currentTab && (
                        <div className="text-xs text-gray-500">
                          <p className="italic">Navigate to a page to see debug info</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-2">
                      <label htmlFor="access-key" className="text-sm font-medium">
                        Infer Access Key
                      </label>
                      <input
                        id="access-key"
                        type="password"
                        value={accessKey}
                        onChange={handleAccessKeyChange}
                        placeholder="Enter your access key..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500">
                        Used for authentication with the Infer proxy
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <hr />
        <div id="firefox-mockup-container">{children}</div>
        <Scripts />
      </body>
    </html>
  );
}
