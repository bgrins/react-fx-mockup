import { describe, it, expect } from "vitest";
import {
  URL_SHORTCUTS,
  LOCAL_PATH_TO_URL,
  URL_TO_SHORTCUT,
  isUrlShortcut,
  resolveUrlShortcut,
  getUrlShortcut,
  getUrlForLocalPath,
  isLocalPath,
} from "./urlShortcuts";

describe("urlShortcuts", () => {
  describe("URL_SHORTCUTS", () => {
    it("should have firefox-wiki mapped to local path", () => {
      expect(URL_SHORTCUTS["firefox-wiki"]).toBe("/pages/firefox-wiki.html");
    });

    it("should have other shortcuts mapped to URLs", () => {
      expect(URL_SHORTCUTS["example"]).toBe("https://example.com");
      expect(URL_SHORTCUTS["npr-text"]).toBe("https://text.npr.org");
      expect(URL_SHORTCUTS["espn"]).toBe("https://www.espn.com");
    });
  });

  describe("LOCAL_PATH_TO_URL", () => {
    it("should map local firefox-wiki path to Wikipedia URL", () => {
      expect(LOCAL_PATH_TO_URL["/pages/firefox-wiki.html"]).toBe(
        "https://en.wikipedia.org/wiki/Firefox",
      );
    });
  });

  describe("URL_TO_SHORTCUT", () => {
    it("should create reverse mapping of URLs to shortcuts", () => {
      expect(URL_TO_SHORTCUT["https://example.com"]).toBe("example");
      expect(URL_TO_SHORTCUT["https://text.npr.org"]).toBe("npr-text");
      expect(URL_TO_SHORTCUT["/pages/firefox-wiki.html"]).toBe("firefox-wiki");
    });
  });

  describe("isUrlShortcut", () => {
    it("should return true for valid shortcuts", () => {
      expect(isUrlShortcut("firefox-wiki")).toBe(true);
      expect(isUrlShortcut("example")).toBe(true);
      expect(isUrlShortcut("npr-text")).toBe(true);
    });

    it("should return false for invalid shortcuts", () => {
      expect(isUrlShortcut("not-a-shortcut")).toBe(false);
      expect(isUrlShortcut("https://example.com")).toBe(false);
      expect(isUrlShortcut("/pages/firefox-wiki.html")).toBe(false);
    });
  });

  describe("resolveUrlShortcut", () => {
    it("should resolve shortcuts to their URLs", () => {
      expect(resolveUrlShortcut("firefox-wiki")).toBe("/pages/firefox-wiki.html");
      expect(resolveUrlShortcut("example")).toBe("https://example.com");
    });

    it("should return the input if not a shortcut", () => {
      expect(resolveUrlShortcut("https://google.com")).toBe("https://google.com");
      expect(resolveUrlShortcut("not-a-shortcut")).toBe("not-a-shortcut");
    });
  });

  describe("getUrlShortcut", () => {
    it("should return shortcut for known URLs", () => {
      expect(getUrlShortcut("https://example.com")).toBe("example");
      expect(getUrlShortcut("/pages/firefox-wiki.html")).toBe("firefox-wiki");
    });

    it("should return the URL if no shortcut exists", () => {
      expect(getUrlShortcut("https://unknown.com")).toBe("https://unknown.com");
    });
  });

  describe("getUrlForLocalPath", () => {
    it("should return real URL for local paths", () => {
      expect(getUrlForLocalPath("/pages/firefox-wiki.html")).toBe(
        "https://en.wikipedia.org/wiki/Firefox",
      );
    });

    it("should return undefined for unknown local paths", () => {
      expect(getUrlForLocalPath("/pages/unknown.html")).toBe(undefined);
      expect(getUrlForLocalPath("https://example.com")).toBe(undefined);
    });
  });

  describe("isLocalPath", () => {
    it("should return true for paths starting with /pages/", () => {
      expect(isLocalPath("/pages/firefox-wiki.html")).toBe(true);
      expect(isLocalPath("/pages/test.html")).toBe(true);
      expect(isLocalPath("/pages/subfolder/file.html")).toBe(true);
    });

    it("should return false for non-local paths", () => {
      expect(isLocalPath("https://example.com")).toBe(false);
      expect(isLocalPath("/other/path.html")).toBe(false);
      expect(isLocalPath("pages/test.html")).toBe(false); // missing leading slash
      expect(isLocalPath("firefox-wiki")).toBe(false);
    });
  });
});
