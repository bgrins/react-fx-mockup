import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBrowserScale } from "./useBrowserScale";

describe("useBrowserScale", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it("should calculate scale correctly for desktop", () => {
    const { result } = renderHook(() => useBrowserScale());

    // With default browser dimensions (1200x800) and desktop padding (40px)
    // Available width: 1920 - 40 = 1880
    // Available height: 1080 - 60 - 40 = 980
    // Scale X: 1880 / 1200 = 1.567 (capped at 1)
    // Scale Y: 980 / 800 = 1.225 (capped at 1)
    expect(result.current.scale).toBe(1);
  });

  it("should calculate scale correctly for mobile", () => {
    // Set mobile dimensions
    window.innerWidth = 500;
    window.innerHeight = 800;

    const { result } = renderHook(() => useBrowserScale());

    // With mobile padding (16px)
    // Available width: 500 - 16 = 484
    // Available height: 800 - 60 - 16 = 724
    // Scale X: 484 / 1200 = 0.403
    // Scale Y: 724 / 800 = 0.905
    // Should use the smaller scale
    expect(result.current.scale).toBeCloseTo(0.403, 2);
  });

  it("should use custom browser dimensions", () => {
    const customDimensions = { width: 800, height: 600 };
    const { result } = renderHook(() => useBrowserScale({ browserDimensions: customDimensions }));

    expect(result.current.browserDimensions).toEqual(customDimensions);
  });

  it("should return correct container style", () => {
    const { result } = renderHook(() => useBrowserScale());

    const containerStyle = result.current.containerStyle;
    expect(containerStyle.width).toBe("1200px");
    expect(containerStyle.height).toBe("800px");
  });

  it("should return correct browser style", () => {
    const { result } = renderHook(() => useBrowserScale());

    const browserStyle = result.current.browserStyle;
    expect(browserStyle.transform).toBe("scale(1)");
    expect(browserStyle.transformOrigin).toBe("top left");
    expect(browserStyle.width).toBe("1200px");
    expect(browserStyle.height).toBe("800px");
    expect(browserStyle.left).toBe("50%");
    expect(browserStyle.marginLeft).toBe("-600px");
  });

  it("should update scale on window resize", async () => {
    const { result, rerender } = renderHook(() => useBrowserScale());

    expect(result.current.scale).toBe(1);

    // Simulate window resize to mobile
    window.innerWidth = 400;
    window.innerHeight = 600;
    window.dispatchEvent(new Event("resize"));

    // Force a rerender to see the updated scale
    rerender();

    // With mobile dimensions, scale should be less than 1
    expect(result.current.scale).toBeLessThan(1);
  });

  it("should apply custom header height", () => {
    window.innerHeight = 500;

    const { result: defaultResult } = renderHook(() => useBrowserScale());
    const { result: customResult } = renderHook(() => useBrowserScale({ headerHeight: 100 }));

    // Custom header height should result in less available height and smaller scale
    expect(customResult.current.scale).toBeLessThan(defaultResult.current.scale);
  });

  it("should apply custom padding values", () => {
    window.innerWidth = 1000;

    const { result: defaultResult } = renderHook(() => useBrowserScale());
    const { result: customResult } = renderHook(() => useBrowserScale({ desktopPadding: 100 }));

    // More padding should result in less available space and smaller scale
    expect(customResult.current.scale).toBeLessThan(defaultResult.current.scale);
  });

  it("should distinguish between mobile and desktop padding", () => {
    // Test mobile
    window.innerWidth = 500;
    const { result: mobileResult } = renderHook(() =>
      useBrowserScale({ mobilePadding: 50, desktopPadding: 100 }),
    );
    const mobileScale = mobileResult.current.scale;

    // Test desktop
    window.innerWidth = 1920;
    const { result: desktopResult } = renderHook(() =>
      useBrowserScale({ mobilePadding: 50, desktopPadding: 100 }),
    );
    const desktopScale = desktopResult.current.scale;

    // Scales should be different based on padding
    expect(mobileScale).not.toBe(desktopScale);
  });

  it("should clean up resize listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useBrowserScale());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
