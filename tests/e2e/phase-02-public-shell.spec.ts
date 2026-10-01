import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const visualQaDirectory = ".tmp/visual-qa";

test("English Home renders database categories and recent real listings", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "What are you craving?" }),
  ).toBeVisible();
  await expect(page.getByText("Moroccan", { exact: true })).toBeVisible();
  await expect(page.locator("[data-listing-card]")).toHaveCount(8);
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});

test("French Home localizes product UI while preserving authored listing content", async ({
  page,
}) => {
  await page.goto("/fr");
  await expect(
    page.getByRole("heading", { name: "Qu’est-ce qui vous fait envie ?" }),
  ).toBeVisible();
  await expect(
    page.getByText("Cuisine marocaine", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Gâteaux", { exact: true })).toBeVisible();
  await expect(page.getByText("Pastilla poulet maison")).toBeVisible();
});

test("language switching preserves the Explore route and safe query state", async ({
  page,
}) => {
  await page.goto("/fr/explore?q=rfissa&city=rabat");
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/explore\?q=rfissa&city=rabat$/u);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your next homemade favorite",
  );
});

test("desktop navigation exposes implemented routes without broken future links", async ({
  page,
}) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await page.goto("/en");
  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(navigation.getByRole("link", { name: "Explore" })).toBeVisible();
  await expect(
    navigation.getByText("Favorites", { exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
});

test("mobile navigation and French content reflow at 320px without overlap", async ({
  page,
}) => {
  await page.setViewportSize({ height: 720, width: 320 });
  await page.goto("/fr");
  const navigation = page.getByRole("navigation", {
    name: "Navigation mobile",
  });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByText("Accueil", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Vendre", { exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await page
    .getByRole("heading", { name: "Vous cuisinez des plats qu’on adore ?" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", {
      name: "Vous cuisinez des plats qu’on adore ?",
    }),
  ).toBeVisible();
});

test("public navigation is keyboard reachable and Home has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.locator("[data-listing-card]")).toHaveCount(8);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious",
    ),
  ).toEqual([]);
});

test("Home publishes localized canonical and reciprocal alternate metadata", async ({
  page,
}) => {
  await page.goto("/fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:3000/fr",
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en$/u,
  );
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute(
    "href",
    /\/fr$/u,
  );
  await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
    "href",
    /\/en$/u,
  );
});

test("captures populated public-shell visual QA artifacts", async ({
  page,
}) => {
  await mkdir(visualQaDirectory, { recursive: true });

  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "What are you craving?" }),
  ).toBeVisible();
  await expect(page.locator("[data-listing-card]")).toHaveCount(8);
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/en-home-desktop.png`,
  });
  await page.goto("/fr");
  await expect(
    page.getByRole("heading", { name: "Qu’est-ce qui vous fait envie ?" }),
  ).toBeVisible();
  await expect(page.locator("[data-listing-card]")).toHaveCount(8);
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/fr-home-desktop.png`,
  });
  await page.goto("/en/explore");
  await expect(
    page.getByRole("heading", { name: "Your next homemade favorite" }),
  ).toBeVisible();
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/en-explore-desktop.png`,
  });

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "What are you craving?" }),
  ).toBeVisible();
  await expect(page.locator("[data-listing-card]")).toHaveCount(8);
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/en-home-mobile.png`,
  });
  await page.goto("/fr");
  await expect(
    page.getByRole("heading", { name: "Qu’est-ce qui vous fait envie ?" }),
  ).toBeVisible();
  await expect(page.locator("[data-listing-card]")).toHaveCount(8);
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/fr-home-mobile.png`,
  });
});

test("a discovery query with no matches renders the honest empty state", async ({
  page,
}) => {
  await page.goto("/en/explore?q=definitely-not-a-real-dish");
  await expect(page.locator("[data-listing-card]")).toHaveCount(0);
  await expect(page.locator('[data-marketplace-state="empty"]')).toContainText(
    "No dishes match these filters.",
  );
  await mkdir(visualQaDirectory, { recursive: true });
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/empty-explore-desktop.png`,
  });
  await page.setViewportSize({ height: 844, width: 390 });
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `${visualQaDirectory}/empty-explore-mobile.png`,
  });
});
