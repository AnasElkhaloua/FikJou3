import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const visualQaDirectory = ".tmp/visual-qa";

test("English Explore renders real PostgreSQL listings and opens a result", async ({
  page,
}) => {
  await page.goto("/en/explore");
  await expect(
    page.getByRole("heading", {
      name: "Your next homemade favorite starts here",
    }),
  ).toBeVisible();
  await expect(page.locator("[data-listing-card]")).toHaveCount(12);
  await expect(page.getByText("15 results")).toBeVisible();

  const form = page.locator(".discovery-form-desktop");
  await form.getByLabel("Food or dish").fill("  pastilla   poulet ");
  await form.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=pastilla(?:\+|%20)poulet/u);
  await expect(page.locator("[data-listing-card]")).toHaveCount(1);
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  await page.getByRole("link", { name: "Pastilla poulet maison" }).click();
  await expect(page).toHaveURL(/\/en\/listing\/pastilla-discovery$/u);
});

test("desktop filters compose, sort, clear, and paginate through URL state", async ({
  page,
}) => {
  await page.goto("/en/explore");
  const form = page.locator(".discovery-form-desktop");
  await form.locator('select[name="city"]').selectOption("casablanca");
  await form.locator('select[name="area"]').selectOption("maarif");
  await form.locator('select[name="category"]').selectOption("desserts");
  await form.locator('input[name="min"]').fill("40");
  await form.locator('input[name="max"]').fill("50");
  await form.locator('input[name="delivery"]').check();
  await form.locator('select[name="sort"]').selectOption("price-desc");
  await form.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/city=casablanca/u);
  await expect(page).toHaveURL(/category=desserts/u);
  await expect(page).toHaveURL(/area=maarif/u);
  await expect(page).toHaveURL(/delivery=1/u);
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  await expect(
    page.locator(".active-filters").getByRole("link", { name: "Casablanca" }),
  ).toBeVisible();
  await expect(
    page.locator(".active-filters").getByRole("link", { name: "Desserts" }),
  ).toBeVisible();
  await expect(
    page.locator(".active-filters").getByRole("link", { name: "Maarif" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear all" }).last().click();
  await expect(page).toHaveURL(/\/en\/explore$/u);

  await page.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/u);
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expect(page.locator("[data-listing-card]")).toHaveCount(3);
});

test("French discovery preserves filters and authored content across locale switching", async ({
  page,
}) => {
  await page.goto(
    "/en/explore?q=Pastilla&category=desserts&city=casablanca&delivery=1",
  );
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  await page.getByRole("link", { name: "FR", exact: true }).click();
  await expect(page).toHaveURL(
    /\/fr\/explore\?q=Pastilla&category=desserts&city=casablanca&delivery=1$/u,
  );
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  await expect(
    page.getByRole("article").getByText("Maârif", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 résultat")).toBeVisible();
});

test("category routes use stable identity and localized metadata", async ({
  page,
}) => {
  await page.goto("/fr/category/desserts");
  await expect(
    page.getByRole("heading", { name: "Desserts", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/fr\/category\/desserts$/u,
  );
});

test("mobile filters work at 320px without overflow and remain accessible", async ({
  page,
}) => {
  await page.setViewportSize({ height: 800, width: 320 });
  await page.goto("/fr/explore");
  await page.getByText("Filtres", { exact: true }).click();
  const form = page.locator(".discovery-mobile-filters form");
  await form.locator('select[name="city"]').selectOption("casablanca");
  await form.locator('select[name="category"]').selectOption("desserts");
  await form.locator('input[name="delivery"]').check();
  await form.getByRole("button", { name: "Appliquer les filtres" }).click();
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious",
    ),
  ).toEqual([]);
});

test("invalid and empty discovery states fail safely", async ({ page }) => {
  await page.goto(
    "/en/explore?sort=drop-table&page=999999&min=0&q=definitely-not-real",
  );
  await expect(page).toHaveURL(
    "http://127.0.0.1:3000/en/explore?q=definitely-not-real",
  );
  await expect(
    page.getByRole("heading", { name: "No dishes match these filters." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear filters" })).toBeVisible();
});

test("captures Phase 04 desktop and mobile visual QA states", async ({
  page,
}) => {
  await mkdir(visualQaDirectory, { recursive: true });
  await page.setViewportSize({ height: 900, width: 1440 });
  for (const [name, url] of [
    ["default", "/en/explore"],
    ["filtered", "/en/explore?category=desserts&city=casablanca&delivery=1"],
    ["empty", "/en/explore?q=definitely-not-real"],
  ] as const) {
    await page.goto(url);
    if (name === "empty") {
      await expect(
        page.getByRole("heading", { name: "No dishes match these filters." }),
      ).toBeVisible();
    } else if (name === "filtered") {
      await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
    } else {
      await expect(page.locator("[data-listing-card]")).toHaveCount(12);
    }
    await page.screenshot({
      caret: "initial",
      fullPage: true,
      path: `${visualQaDirectory}/phase04-${name}-desktop.png`,
    });
  }
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/fr/explore");
  await expect(page.locator("[data-listing-card]")).toHaveCount(12);
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/phase04-default-mobile.png`,
  });
  await page.getByText("Filtres", { exact: true }).click();
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/phase04-filters-mobile.png`,
  });
  await page.goto("/fr/explore?category=desserts&city=casablanca&delivery=1");
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/phase04-active-mobile.png`,
  });
  await page.goto("/fr/explore?q=definitely-not-real");
  await expect(
    page.getByRole("heading", {
      name: "Aucun plat ne correspond à ces filtres.",
    }),
  ).toBeVisible();
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/phase04-empty-mobile.png`,
  });
});
