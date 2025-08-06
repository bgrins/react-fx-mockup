export interface Shortcut {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export const defaultShortcuts: Shortcut[] = [
  {
    id: "example",
    title: "Example",
    url: "https://example.com",
    favicon: "/default-favicon.svg",
  },
  {
    id: "npr",
    title: "NPR Text",
    url: "https://text.npr.org",
    favicon: "https://text.npr.org/favicon.ico",
  },
  {
    id: "espn",
    title: "ESPN",
    url: "https://www.espn.com",
    favicon: "https://a.espncdn.com/favicon.ico",
  },
  {
    id: "wikipedia",
    title: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Main_Page",
    favicon: "https://en.wikipedia.org/static/favicon/wikipedia.ico",
  },
  {
    id: "mozilla",
    title: "Mozilla",
    url: "https://www.mozilla.org",
    favicon: "https://www.mozilla.org/media/img/favicons/mozilla/favicon-196x196.png",
  },
  {
    id: "firefox",
    title: "Firefox",
    url: "https://www.firefox.com",
    favicon: "https://www.mozilla.org/media/img/favicons/firefox/browser/favicon-196x196.png",
  },
  {
    id: "firefox-wiki",
    title: "Firefox Wiki",
    url: "/pages/firefox-wiki.html",
    favicon: "https://en.wikipedia.org/static/favicon/wikipedia.ico",
  },
  {
    id: "test-page",
    title: "Test Page",
    url: "/test-page.html",
    favicon: "/default-favicon.svg",
  },
  {
    id: "villa-il-vecchio",
    title: "Villa Il Vecchio",
    url: "/pages/villa-il-vecchio.html",
    favicon: "https://www.airbnb.com/favicon.ico",
  },
  {
    id: "st-george",
    title: "St. George",
    url: "/pages/st-george.html",
    favicon: "https://www.airbnb.com/favicon.ico",
  },
  {
    id: "firefox-github",
    title: "Firefox GitHub",
    url: "https://github.com/mozilla-firefox/firefox",
    favicon: "https://github.githubassets.com/favicons/favicon.svg",
  },
];
