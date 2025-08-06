import { test, expect } from "@playwright/test";

test.describe("SQLite Vec Storage", () => {
  test("should initialize sqlite-vec and store/retrieve vector data", async ({ page }) => {
    // Navigate to the sqlite-vec demo route
    await page.goto("/sqlite-vec-demo");

    // Wait for the component to load
    await expect(page.locator("text=SQLite Vec Demo")).toBeVisible();

    // Click the run demo button
    await page.click('button:text("Run Demo")');

    // Wait for initialization message
    await expect(page.locator("text=🔄 Running SQLite Vec demo...")).toBeVisible();

    // Wait for database to be ready (the button should be enabled)
    await expect(page.locator('button:text("Run Demo")')).not.toBeDisabled();

    // Wait for initialization (check for any of the possible initialization messages)
    await page.waitForFunction(
      () => {
        const output = document.querySelector(".bg-gray-100")?.textContent || "";
        return (
          output.includes("✅ Successfully created") ||
          output.includes("⚠️") ||
          output.includes("vec_version")
        );
      },
      { timeout: 10000 },
    );

    // Check that vec_version is working
    await expect(page.locator("text=✅ vec_version:")).toBeVisible();

    // Check that vector operations work
    await expect(page.locator("text=✅ Created and inserted vectors:")).toBeVisible();

    // Check that vector similarity calculations work
    await expect(page.locator("text=✅ Vector similarities:")).toBeVisible();

    // Verify that the output contains actual vector data
    const vectorOutput = await page.locator("text=✅ Created and inserted vectors:").textContent();
    expect(vectorOutput).toContain("1.000000,2.000000,3.000000");
    expect(vectorOutput).toContain("4.000000,5.000000,6.000000");

    // Verify that similarity calculations return numeric results
    const similarityOutput = await page.locator("text=✅ Vector similarities:").textContent();
    expect(similarityOutput).toMatch(/0\.\d+/);
  });

  test("should handle database initialization correctly on page load", async ({ page }) => {
    // Visit the React route
    await page.goto("/sqlite-vec-demo");

    // Wait for the component to load
    await expect(page.locator("text=SQLite Vec Demo")).toBeVisible();

    // Check that we have a ready status indicator
    await expect(page.locator("text=Ready")).toBeVisible({ timeout: 10000 });

    // Click run demo button
    await page.click('button:text("Run Demo")');

    // Verify that vec_version works (indicating the WASM module loads correctly)
    await expect(page.locator("text=✅ vec_version:")).toBeVisible();

    // Verify basic functionality works
    await expect(page.locator("text=✅ Created and inserted vectors:")).toBeVisible();
  });
});
