import { test, expect } from "@playwright/test";

test.describe("Test Page - Proxy Tunnel", () => {
  test("should update tab title when test page changes title", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Click on Test Page bookmark
    console.log("Clicking on Test Page bookmark...");
    const testPageLink = page.getByText("Test Page");
    await expect(testPageLink).toBeVisible();
    await testPageLink.click();

    // Wait for iframe to load and title to update
    await page.waitForTimeout(2000);

    // Wait for the tab title to update from "Loading..."
    await expect(page.locator('.tab-title[data-tab-active="true"]')).toHaveText(
      "Test Page - Proxy Tunnel",
      { timeout: 10000 },
    );

    // Check initial tab title
    const initialTabTitle = await page.locator('.tab-title[data-tab-active="true"]').textContent();
    console.log("Initial tab title:", initialTabTitle);

    // Click the "Change Page Title" button inside the iframe
    const iframe = page.frameLocator("iframe").first();
    await iframe.getByText("Change Page Title").click();

    // Wait for title update
    await page.waitForTimeout(1000);

    // Check that the tab title updated
    const updatedTabTitle = await page.locator('.tab-title[data-tab-active="true"]').textContent();
    console.log("Updated tab title:", updatedTabTitle);
    expect(updatedTabTitle).not.toBe("Loading...");
    expect(updatedTabTitle).toContain("Test Page");

    // Verify the iframe is loading the local test page
    const iframeSrc = await page.locator("iframe").first().getAttribute("src");
    console.log("Iframe src:", iframeSrc);
    expect(iframeSrc).toBe("/test-page.html");

    // Verify the URL bar shows the example.com URL
    // The URL bar displays as separate domain and path spans when not focused
    const domain = await page.locator(".text-gray-900").textContent();
    const path = await page.locator(".url-path").textContent();
    console.log("URL bar domain:", domain);
    console.log("URL bar path:", path);
    expect(domain).toBe("example.com");
    expect(path).toBe("/test-page.html");
  });
});
