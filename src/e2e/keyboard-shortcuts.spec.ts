import { test, expect } from "@playwright/test";

test.describe("Keyboard Shortcuts", () => {
  test("Page Info shortcut (Cmd+I) should toggle sidebar", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // Small delay to ensure event listeners are attached

    // Verify sidebar is not visible initially
    await expect(page.locator('text="Chat with Page"')).not.toBeVisible();

    // Press Cmd+I (Meta+i on Mac) to open sidebar
    await page.keyboard.press("Meta+i");

    // Verify sidebar is now visible
    await expect(page.locator('text="Chat with Page"')).toBeVisible();
    await expect(page.locator('[aria-label="Close sidebar"]')).toBeVisible();

    // Press Cmd+I again to close sidebar
    await page.keyboard.press("Meta+i");

    // Verify sidebar is closed
    await expect(page.locator('text="Chat with Page"')).not.toBeVisible();
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
    await expect(page.locator('text="Starting States"')).toBeVisible();
    await expect(page.locator('text="Page Info"')).toBeVisible();
    await expect(page.locator('text="⌘I"')).toBeVisible();

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

    // Verify Page Info shortcut is listed
    await expect(page.locator('text="Page Info"')).toBeVisible();
    await expect(page.locator('text="⌘I"')).toBeVisible();
  });

  test("Multiple shortcuts should work in sequence", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Open sidebar with Cmd+I
    await page.keyboard.press("Meta+i");
    await expect(page.locator('text="Chat with Page"')).toBeVisible();

    // Open settings with Cmd+/
    await page.keyboard.press("Meta+/");
    await expect(page.locator('text="Settings & Help"')).toBeVisible();

    // Close settings with Escape
    await page.keyboard.press("Escape");
    await expect(page.locator('text="Settings & Help"')).not.toBeVisible();

    // Sidebar should still be visible
    await expect(page.locator('text="Chat with Page"')).toBeVisible();

    // Close sidebar with Cmd+I
    await page.keyboard.press("Meta+i");
    await expect(page.locator('text="Chat with Page"')).not.toBeVisible();
  });
});
