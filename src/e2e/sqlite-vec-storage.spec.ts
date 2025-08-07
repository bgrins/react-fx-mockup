import { test, expect } from "@playwright/test";

test.describe("SQLite Vec Storage", () => {
  test("should initialize sqlite-vec and load synthetic profiles dataset", async ({ page }) => {
    // Navigate to the sqlite-vec demo route
    await page.goto("/sqlite-vec-demo");

    // Wait for the component to load
    await expect(page.locator("text=SQLite Vec Demo - Synthetic Profiles Dataset")).toBeVisible();

    // Wait for data to be loaded (either auto-loaded or already present)
    await expect(page.locator("text=Pre-built Analytics Queries")).toBeVisible({ timeout: 20000 });

    // Verify the record count badge is shown
    await expect(page.locator('span:has-text("records loaded")')).toBeVisible();

    // Test one of the query buttons
    await page.click('button:text("Top 10 Domains by Visits")');

    // Check that query executed and shows results
    await expect(page.locator("text=🔍 Running Top 10 Domains by Visits...")).toBeVisible();
    await expect(page.locator("text=✅ Query results")).toBeVisible({ timeout: 10000 });
  });

  test("should handle database initialization correctly on page load", async ({ page }) => {
    // Visit the React route
    await page.goto("/sqlite-vec-demo");

    // Wait for the component to load
    await expect(page.locator("text=SQLite Vec Demo - Synthetic Profiles Dataset")).toBeVisible();

    // Check that we have a ready status indicator
    await expect(page.locator("text=Ready")).toBeVisible({ timeout: 10000 });

    // Wait for data to be auto-loaded and ready
    await expect(page.locator("text=Pre-built Analytics Queries")).toBeVisible({ timeout: 15000 });

    // Verify the reload button is available (means data is loaded)
    await expect(page.locator('button:text("Reload Dataset")')).toBeVisible();

    // Verify the record count badge
    await expect(page.locator('span:has-text("records loaded")')).toBeVisible();

    // Test that we can run a query
    await page.click('button:text("Interest Categories Breakdown")');

    // Verify query execution
    await expect(page.locator("text=🔍 Running Interest Categories Breakdown...")).toBeVisible();
    await expect(page.locator("text=✅ Query results")).toBeVisible({ timeout: 10000 });
  });
});
