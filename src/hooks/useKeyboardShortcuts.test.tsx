import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ShortcutHandlers } from "~/types/browser";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  let mockHandlers: ShortcutHandlers;
  let originalPlatform: string;

  beforeEach(() => {
    // Save original platform
    originalPlatform = navigator.platform;

    // Mock macOS platform
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      writable: true,
      configurable: true,
    });

    mockHandlers = {
      back: vi.fn(),
      forward: vi.fn(),
      reload: vi.fn(),
      newTab: vi.fn(),
      closeTab: vi.fn(),
      toggleSettings: vi.fn(),
      pageInfo: vi.fn(),
      focusAddressBar: vi.fn(),
      toggleSidebar: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();

    // Restore original platform
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  it("should call pageInfo handler when Cmd+I is pressed", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    // Simulate Cmd+I keypress
    const event = new KeyboardEvent("keydown", {
      key: "i",
      metaKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(mockHandlers.pageInfo).toHaveBeenCalledTimes(1);
  });

  it("should call pageInfo handler when Ctrl+I is pressed on non-Mac", () => {
    // Mock non-Mac platform
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      writable: true,
      configurable: true,
    });

    renderHook(() => useKeyboardShortcuts(mockHandlers));

    // Simulate Ctrl+I keypress
    const event = new KeyboardEvent("keydown", {
      key: "i",
      ctrlKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(mockHandlers.pageInfo).toHaveBeenCalledTimes(1);
  });

  it("should call toggleSettings handler when Cmd+/ is pressed", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    // Simulate Cmd+/ keypress (which is Cmd+? without shift)
    const event = new KeyboardEvent("keydown", {
      key: "/",
      metaKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(mockHandlers.toggleSettings).toHaveBeenCalledTimes(1);
  });

  it("should not call handlers when modifiers don't match", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    // Simulate just 'i' without Cmd/Ctrl
    const event = new KeyboardEvent("keydown", {
      key: "i",
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(mockHandlers.pageInfo).not.toHaveBeenCalled();
  });

  it("should prevent default when handling shortcut", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const event = new KeyboardEvent("keydown", {
      key: "i",
      metaKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    expect(mockHandlers.pageInfo).toHaveBeenCalledTimes(1);
  });

  it("should not handle shortcuts when disabled", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers, { enabled: false }));

    const event = new KeyboardEvent("keydown", {
      key: "i",
      metaKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(mockHandlers.pageInfo).not.toHaveBeenCalled();
  });

  it("should handle multiple shortcuts in sequence", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    // Press Cmd+I
    const pageInfoEvent = new KeyboardEvent("keydown", {
      key: "i",
      metaKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(pageInfoEvent);
    });

    expect(mockHandlers.pageInfo).toHaveBeenCalledTimes(1);

    // Press Cmd+/
    const settingsEvent = new KeyboardEvent("keydown", {
      key: "/",
      metaKey: true,
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(settingsEvent);
    });

    expect(mockHandlers.toggleSettings).toHaveBeenCalledTimes(1);
  });

  it("should cleanup event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockHandlers));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
