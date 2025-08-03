import { describe, it, expect } from "vitest";
import { LOCAL_PATH_TO_URL, getUrlForLocalPath, isLocalPath } from "./urlShortcuts";

describe("urlShortcuts", () => {
  describe("LOCAL_PATH_TO_URL", () => {
    it("should map local firefox-wiki path to Wikipedia URL", () => {
      expect(LOCAL_PATH_TO_URL["/pages/firefox-wiki.html"]).toBe(
        "https://en.wikipedia.org/wiki/Firefox",
      );
    });

    it("should map test page to example.com URL", () => {
      expect(LOCAL_PATH_TO_URL["/test-page.html"]).toBe("https://example.com/test-page.html");
    });
  });

  describe("getUrlForLocalPath", () => {
    it("should return real URL for local paths", () => {
      expect(getUrlForLocalPath("/pages/firefox-wiki.html")).toBe(
        "https://en.wikipedia.org/wiki/Firefox",
      );
      expect(getUrlForLocalPath("/test-page.html")).toBe("https://example.com/test-page.html");
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

    it("should return true for test page", () => {
      expect(isLocalPath("/test-page.html")).toBe(true);
    });

    it("should return false for non-local paths", () => {
      expect(isLocalPath("https://example.com")).toBe(false);
      expect(isLocalPath("/other/path.html")).toBe(false);
      expect(isLocalPath("pages/test.html")).toBe(false); // missing leading slash
      expect(isLocalPath("firefox-wiki")).toBe(false);
    });
  });
});
