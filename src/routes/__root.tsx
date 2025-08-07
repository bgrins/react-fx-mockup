/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import * as React from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import { SettingsIcon } from "~/components/icons";
import { SettingsModal } from "~/components/firefox/SettingsModal";
import { DebugProvider } from "~/contexts/DebugContext";
import { ProfileProvider } from "~/contexts/ProfileContext";
import { Toaster } from "~/components/ui/sonner";

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
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: (props) => (
    <ProfileProvider>
      <DebugProvider>
        <RootDocument {...props} />
      </DebugProvider>
    </ProfileProvider>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }): React.ReactElement {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlAccessKey = urlParams.get("accessKey") || urlParams.get("access-key");
    const urlProfile = urlParams.get("profile");

    let needsReload = false;

    if (urlAccessKey) {
      localStorage.setItem("infer-access-key", urlAccessKey);
      urlParams.delete("accessKey");
      urlParams.delete("access-key");
      needsReload = true;
    } else if (
      !localStorage.getItem("infer-access-key") &&
      import.meta.env.DEV &&
      import.meta.env.VITE_INFER_ACCESS_KEY
    ) {
      // If no stored value, use env variable in development only
      localStorage.setItem("infer-access-key", import.meta.env.VITE_INFER_ACCESS_KEY);
    }

    if (urlProfile) {
      localStorage.setItem("selected-profile", urlProfile);
      urlParams.delete("profile");
      needsReload = true;
    }

    if (needsReload) {
      const newUrl = window.location.pathname + (urlParams.size ? `?${urlParams.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
      window.location.reload();
    }
  }, []);

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden">
        <div
          id="mockup-manager-toolbar"
          className="p-1 sm:p-2 flex gap-1 sm:gap-2 text-lg items-center"
        >
          <img src="/firefox.svg" alt="Firefox" width="20" height="20" className="sm:w-6 sm:h-6" />
          <span className="font-semibold text-gray-700 text-sm sm:text-lg">Firefox Mockup</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-md"
              title="Settings (⌘?)"
            >
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <hr />
        <div id="firefox-mockup-container">{children}</div>
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <Toaster position="bottom-center" />
        <Scripts />
      </body>
    </html>
  );
}
