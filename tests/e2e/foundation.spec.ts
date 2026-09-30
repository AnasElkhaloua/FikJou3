import { expect, test } from "@playwright/test";

test("renders the Phase 00 shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Fik Jou3?");
  await expect(
    page.getByRole("heading", { name: "The foundation is ready." }),
  ).toBeVisible();
  await expect(
    page.getByText("Marketplace features begin in later phases."),
  ).toBeVisible();
});

test("fits a 320px viewport and preserves the RTL sample", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const hasHorizontalOverflow = await page
    .locator("html")
    .evaluate((element) => {
      return element.scrollWidth > element.clientWidth;
    });

  expect(hasHorizontalOverflow).toBe(false);
  await expect(page.getByText("واش فيك الجوع؟")).toHaveAttribute("dir", "rtl");
});
