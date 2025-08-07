import { test, expect } from "@playwright/test";

test.describe("Smart Window Mode - Local Pages Title Updates", () => {
  test("should update tab title for local pages when in Smart Window mode", async ({ page }) => {
    // Listen to console logs
    page.on("console", (msg) => console.log(`[BROWSER] ${msg.text()}`));

    // Navigate to the app
    await page.goto("http://localhost:3000");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Enable Smart Window mode first by clicking the toggle button on the new tab page
    const smartWindowButton = page.getByText("Smart Window");
    await expect(smartWindowButton).toBeVisible();
    await smartWindowButton.click();

    // Click on Test Page bookmark
    console.log("Clicking on Test Page bookmark...");
    const testPageLink = page.getByText("Test Page");
    await expect(testPageLink).toBeVisible();
    await testPageLink.click();

    // Wait for iframe to load
    await page.waitForTimeout(3000);

    // Get the current tab title
    const tabTitle = await page.locator('.tab-title[data-tab-active="true"]').textContent();
    console.log("Tab title after navigation:", tabTitle);

    // In Smart Window mode, local pages should have their titles updated correctly
    expect(tabTitle).toBe("Test Page - Proxy Tunnel");

    // Verify the iframe is loading the local test page
    const iframeSrc = await page.locator("iframe").first().getAttribute("src");
    console.log("Iframe src:", iframeSrc);
    expect(iframeSrc).toBe("/test-page.html");

    // Click the "Change Page Title" button inside the iframe to test dynamic title updates
    const iframe = page.frameLocator("iframe").first();
    await iframe.getByText("Change Page Title").click();

    // Wait and check the title again
    await page.waitForTimeout(1000);
    const updatedTabTitle = await page.locator('.tab-title[data-tab-active="true"]').textContent();
    console.log("Tab title after dynamic change:", updatedTabTitle);

    // The title should be updated with the dynamic content in Smart Window mode
    // This demonstrates that proxy tunnel script injection works correctly
    expect(updatedTabTitle).toMatch(/Test Page - \d+:\d+:\d+ [AP]M/);
  });

  test("should update tab title for local pages when NOT in Smart Window mode", async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Stay in normal mode (don't enable Smart Window mode)
    // Click on Test Page bookmark
    console.log("Clicking on Test Page bookmark in normal mode...");
    const testPageLink = page.getByText("Test Page");
    await expect(testPageLink).toBeVisible();
    await testPageLink.click();

    // Wait for iframe to load and title to update
    await page.waitForTimeout(3000);

    // In normal mode, the title should be updated properly
    await expect(page.locator('.tab-title[data-tab-active="true"]')).toHaveText(
      "Test Page - Proxy Tunnel",
      { timeout: 10000 },
    );

    const tabTitle = await page.locator('.tab-title[data-tab-active="true"]').textContent();
    console.log("Tab title in normal mode:", tabTitle);
    expect(tabTitle).toContain("Test Page");
  });
});
