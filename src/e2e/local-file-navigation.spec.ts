import { test, expect } from "@playwright/test";

test.describe("Local File Navigation", () => {
  test("should update tab title when loading local files", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Debug: log what we see on the page
    const pageTitle = await page.title();
    console.log("Page title:", pageTitle);

    // Wait for Firefox Wiki link to be clickable
    const firefoxWikiLink = page.getByText("Firefox Wiki");
    await expect(firefoxWikiLink).toBeVisible();

    // Click on Firefox Wiki bookmark
    console.log("Clicking on Firefox Wiki bookmark...");
    await firefoxWikiLink.click();

    // Wait for iframe to load and for title to update
    await page.waitForTimeout(3000);

    // Debug: Take a screenshot
    await page.screenshot({ path: "test-results/after-navigation.png" });

    // Check the tab title - wait for it to not be "Loading..." anymore
    await expect(page.locator('.tab-title[data-tab-active="true"]')).not.toHaveText("Loading...", {
      timeout: 10000,
    });

    const tabTitle = await page.locator('.tab-title[data-tab-active="true"]').textContent();
    console.log("Tab title after navigation:", tabTitle);

    // The title should contain "Firefox" (from the Wikipedia page)
    expect(tabTitle).toContain("Firefox");

    // Verify we loaded the local file
    const iframe = page.locator("iframe").first();
    const iframeSrc = await iframe.getAttribute("src");
    console.log("Iframe src:", iframeSrc);
    expect(iframeSrc).toBe("/pages/firefox-wiki.html");
  });
});
