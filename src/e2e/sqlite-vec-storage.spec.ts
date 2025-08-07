import { test, expect } from "@playwright/test";

test.describe("SQLite Vec Storage", () => {
  test("should initialize sqlite-vec and load synthetic profiles dataset", async ({ page }) => {
    // Navigate to the sqlite-vec demo route
    await page.goto("/sqlite-vec-demo");

    // Wait for the component to load
    await expect(page.locator("text=SQLite Vec Demo - Synthetic Profiles Dataset")).toBeVisible();

    // Click the load dataset button
    await page.click('button:text("Load Synthetic Profiles Dataset")');

    // Wait for initialization message
    await expect(page.locator("text=🔄 Loading Synthetic Profiles dataset...")).toBeVisible();

    // Wait for database to be ready (the button should be enabled)
    await expect(page.locator('button:text("Load Synthetic Profiles Dataset")')).not.toBeDisabled();

    // Wait for initialization (check for any of the possible initialization messages)
    await page.waitForFunction(
      () => {
        const output = document.querySelector(".bg-gray-100")?.textContent || "";
        return (
          output.includes("✅ vec_version:") ||
          output.includes("✅ Loaded") ||
          output.includes("synthetic profile records")
        );
      },
      { timeout: 15000 }, // Increased timeout for dataset loading
    );

    // Check that vec_version is working
    await expect(page.locator("text=✅ vec_version:")).toBeVisible();

    // Check that dataset was loaded
    await expect(page.locator("text=✅ Loaded")).toBeVisible();

    // Check that we have persona statistics
    await expect(page.locator("text=👤 Top personas by visits:")).toBeVisible();

    // Check that we have interest statistics
    await expect(page.locator("text=🎯 Top interests:")).toBeVisible();

    // Check that we have domain statistics
    await expect(page.locator("text=🌐 Top domains:")).toBeVisible();

    // Check that we have recent visits
    await expect(page.locator("text=📋 Recent visits:")).toBeVisible();
  });

  test("should handle database initialization correctly on page load", async ({ page }) => {
    // Visit the React route
    await page.goto("/sqlite-vec-demo");

    // Wait for the component to load
    await expect(page.locator("text=SQLite Vec Demo - Synthetic Profiles Dataset")).toBeVisible();

    // Check that we have a ready status indicator
    await expect(page.locator("text=Ready")).toBeVisible({ timeout: 10000 });

    // Verify the button is available and enabled
    await expect(page.locator('button:text("Load Synthetic Profiles Dataset")')).toBeEnabled();

    // Click load dataset button
    await page.click('button:text("Load Synthetic Profiles Dataset")');

    // Verify that vec_version works (indicating the WASM module loads correctly)
    await expect(page.locator("text=✅ vec_version:")).toBeVisible();

    // Verify that SQL file loading works
    await expect(page.locator("text=📄 SQL file loaded successfully")).toBeVisible();
  });
});
