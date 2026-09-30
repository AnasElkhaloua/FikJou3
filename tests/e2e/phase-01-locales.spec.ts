import { expect, test } from "@playwright/test";

test("negotiates root to English and renders the localized shell", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/u);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What are you craving?",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("renders French auth UI and preserves the deep route when switching", async ({
  page,
}) => {
  await page.goto("/fr/login?returnTo=%2Ffr%2Fsettings");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Heureux de vous revoir",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");

  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fen%2Fsettings$/u);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Welcome back",
  );
});

test("unsupported locale is handled without loading arbitrary resources", async ({
  page,
}) => {
  await page.goto("/ar/login");
  await expect(page).toHaveURL(/\/en\/ar\/login$/u);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("French registration remains usable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/fr/register");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Créez votre compte",
  );
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
