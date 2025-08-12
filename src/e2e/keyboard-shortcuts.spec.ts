import { test, expect } from "@playwright/test";

test.describe("Keyboard Shortcuts", () => {
  test("Page Info shortcut (Alt+I) should toggle sidebar", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // Small delay to ensure event listeners are attached

    // Verify sidebar is not visible initially
    await expect(page.locator('[title="Page Info"]')).not.toBeVisible();

    // Press Alt+I to open sidebar
    await page.keyboard.press("Alt+i");

    // Verify sidebar is now visible - check for the icon strip and Page Info section
    await expect(page.locator('[title="Page Info"]')).toBeVisible();
    await expect(page.locator('text="Page Info"').first()).toBeVisible();

    // Press Alt+I again to close sidebar
    await page.keyboard.press("Alt+i");

    // Verify sidebar is closed
    await expect(page.locator('[title="Page Info"]')).not.toBeVisible();
  });

  test("Settings shortcut (Cmd+?) should toggle settings modal", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify settings modal is not visible initially
    await expect(page.locator('text="Settings & Help"')).not.toBeVisible();

    // Press Cmd+/ (which is Cmd+? without shift)
    await page.keyboard.press("Meta+/");

    // Verify settings modal is now visible
    await expect(page.locator('text="Settings & Help"')).toBeVisible();

    // Click on the Shortcuts tab
    await page.locator('text="Shortcuts"').click();

    // Verify shortcuts content is visible
    await expect(page.locator('text="Keyboard Shortcuts"')).toBeVisible();
    await expect(page.locator('text="Page Info"')).toBeVisible();
    await expect(page.locator('text="⌥I"')).toBeVisible();

    // Press Cmd+/ again to close modal
    await page.keyboard.press("Meta+/");

    // Verify settings modal is closed
    await expect(page.locator('text="Settings & Help"')).not.toBeVisible();
  });

  test("Page Info shortcut should be listed in settings modal", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Open settings modal
    await page.keyboard.press("Meta+/");

    // Wait for modal to be visible
    await expect(page.locator('text="Settings & Help"')).toBeVisible();

    // Click on the Shortcuts tab to see keyboard shortcuts
    await page.locator('text="Shortcuts"').click();

    // Verify Page Info shortcut is listed
    await expect(page.locator('text="Page Info"')).toBeVisible();
    await expect(page.locator('text="⌥I"')).toBeVisible();
  });

  test("Multiple shortcuts should work in sequence", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Open sidebar with Alt+I
    await page.keyboard.press("Alt+i");
    await expect(page.locator('[title="Page Info"]')).toBeVisible();

    // Open settings with Cmd+/
    await page.keyboard.press("Meta+/");
    await expect(page.locator('text="Settings & Help"')).toBeVisible();

    // Close settings with Escape
    await page.keyboard.press("Escape");
    await expect(page.locator('text="Settings & Help"')).not.toBeVisible();

    // Sidebar should still be visible
    await expect(page.locator('[title="Page Info"]')).toBeVisible();

    // Close sidebar with Alt+I
    await page.keyboard.press("Alt+i");
    await expect(page.locator('[title="Page Info"]')).not.toBeVisible();
  });

  test("Tab management shortcuts (Alt+T, Alt+W) should work", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Count initial tabs using role attribute
    const tabs = page.locator('[role="tab"]');
    const initialCount = await tabs.count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Create new tab with Alt+T
    await page.keyboard.press("Alt+t");
    await page.waitForTimeout(500);
    const afterFirstTab = await tabs.count();
    expect(afterFirstTab).toBe(initialCount + 1);

    // Create another tab
    await page.keyboard.press("Alt+t");
    await page.waitForTimeout(500);
    const afterSecondTab = await tabs.count();
    expect(afterSecondTab).toBe(initialCount + 2);

    // Close current tab with Alt+W
    await page.keyboard.press("Alt+w");
    await page.waitForTimeout(500);
    const afterClose = await tabs.count();
    expect(afterClose).toBe(initialCount + 1);
  });

  test("Tab switching shortcuts (Ctrl+1-9) should work", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Create multiple tabs
    await page.keyboard.press("Alt+t");
    await page.waitForTimeout(200);
    await page.keyboard.press("Alt+t");
    await page.waitForTimeout(200);

    // Switch to first tab with Ctrl+1
    await page.keyboard.press("Control+1");
    await page.waitForTimeout(200);
    const firstTab = page.locator('[role="tab"]').first();
    await expect(firstTab).toHaveAttribute("aria-selected", "true");

    // Switch to second tab with Ctrl+2
    await page.keyboard.press("Control+2");
    await page.waitForTimeout(200);
    const secondTab = page.locator('[role="tab"]').nth(1);
    await expect(secondTab).toHaveAttribute("aria-selected", "true");

    // Switch to last tab with Ctrl+9
    await page.keyboard.press("Control+9");
    await page.waitForTimeout(200);
    const lastTab = page.locator('[role="tab"]').last();
    await expect(lastTab).toHaveAttribute("aria-selected", "true");
  });

  test.skip("Navigation shortcuts (Alt+Home, Alt+Left/Right) should work", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Navigate to a bookmark
    await page.locator('button:has-text("Wikipedia")').first().click();
    await page.waitForTimeout(1000);

    // Click on the address bar area to see the URL
    await page.locator("#firefox-toolbar").click();
    await page.waitForTimeout(500);

    // Check if we navigated to wikipedia - the address bar should contain wikipedia text
    const addressBarArea = page.locator("#firefox-toolbar");
    await expect(addressBarArea).toContainText(/wikipedia/i);

    // Go home with Alt+Home
    await page.keyboard.press("Alt+Home");
    await page.waitForTimeout(500);

    // Should show new tab page
    await expect(page.locator('[data-testid="new-tab-page"]')).toBeVisible();

    // Navigate again for back/forward test
    await page.locator('button:has-text("Mozilla")').first().click();
    await page.waitForTimeout(1000);

    // Go back with Alt+Left
    await page.keyboard.press("Alt+ArrowLeft");
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="new-tab-page"]')).toBeVisible();

    // Go forward with Alt+Right
    await page.keyboard.press("Alt+ArrowRight");
    await page.waitForTimeout(1000);

    // Should be back at Mozilla page - check toolbar contains mozilla
    await expect(addressBarArea).toContainText(/mozilla/i);
  });

  test("Focus address bar shortcut (Alt+L) should work", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Click somewhere on the page body to ensure nothing is focused
    await page.locator("body").click({ position: { x: 100, y: 300 } });
    await page.waitForTimeout(200);

    // Focus address bar with Alt+L
    await page.keyboard.press("Alt+l");
    await page.waitForTimeout(500);

    // Check if address bar input is now visible and focused
    const addressBarInput = page.locator('[data-testid="address-bar-input"]');
    await expect(addressBarInput).toBeVisible();
    await expect(addressBarInput).toBeFocused();
  });

  test("Tab cycling shortcuts (Ctrl+Tab, Ctrl+Shift+Tab) should work", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Create multiple tabs
    await page.keyboard.press("Alt+t");
    await page.waitForTimeout(500);
    await page.keyboard.press("Alt+t");
    await page.waitForTimeout(500);

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    // We should be on the last tab
    const lastTab = tabs.last();
    await expect(lastTab).toHaveAttribute("aria-selected", "true");

    // Cycle backward with Ctrl+Shift+Tab
    await page.keyboard.press("Control+Shift+Tab");
    await page.waitForTimeout(500);
    // Should be on second to last tab
    const secondToLastTab = tabs.nth(tabCount - 2);
    await expect(secondToLastTab).toHaveAttribute("aria-selected", "true");

    // Cycle forward with Ctrl+Tab
    await page.keyboard.press("Control+Tab");
    await page.waitForTimeout(500);
    await expect(lastTab).toHaveAttribute("aria-selected", "true");
  });

  test("Toast notifications should appear for unimplemented shortcuts", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Test bookmark shortcut
    await page.keyboard.press("Alt+d");
    await expect(page.getByText("Bookmark Page")).toBeVisible();

    // Wait for toast to disappear
    await page.waitForTimeout(3500);

    // Test find shortcut
    await page.keyboard.press("Alt+f");
    await expect(page.getByText("Find in Page")).toBeVisible();

    // Wait for toast to disappear
    await page.waitForTimeout(3500);

    // Test zoom shortcuts - use Equal key (which is + with shift)
    await page.keyboard.press("Alt+Equal");
    await expect(page.getByText("Zoom In")).toBeVisible();
  });

  test.skip("Sidebar toggle shortcut (Alt+B) should work", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Ensure sidebar is not visible initially
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();

    // Toggle sidebar with Alt+B
    await page.keyboard.press("Alt+b");
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Toggle again to close
    await page.keyboard.press("Alt+b");
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
  });
});
