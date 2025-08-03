import { test, expect } from "@playwright/test";

test.describe("Back Navigation - URL Bar Update", () => {
  test("should update URL bar when navigating back from local file", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Click on Firefox Wiki bookmark (local file)
    console.log("Clicking on Firefox Wiki bookmark...");
    const firefoxWikiLink = page.getByText("Firefox Wiki");
    await expect(firefoxWikiLink).toBeVisible();
    await firefoxWikiLink.click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Verify Wikipedia URL is shown in URL bar
    const domainAfterLocal = await page.locator(".text-gray-900").textContent();
    const pathAfterLocal = await page.locator(".text-gray-500").textContent();
    console.log("Domain after navigating to local file:", domainAfterLocal);
    console.log("Path after navigating to local file:", pathAfterLocal);
    expect(domainAfterLocal).toBe("en.wikipedia.org");
    expect(pathAfterLocal).toBe("/wiki/Firefox");

    // Click back button
    console.log("Clicking back button...");
    const backButton = page.locator("button.nav-back");
    await expect(backButton).toBeEnabled();
    await backButton.click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Verify URL bar updated back to about:blank (new tab)
    const urlBarText = await page.locator(".text-gray-400").textContent();
    console.log("URL bar text after pressing back:", urlBarText);
    expect(urlBarText).toBe("Search or enter address");
  });
});
