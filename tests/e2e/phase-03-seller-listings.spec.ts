import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const ownerEmail = "phase03-owner@example.test";
const otherEmail = "phase03-other@example.test";
const password = "phase03-password-long-enough";
const authoredTitle = "Rfissa maison بالدجاج";
const authoredDescription = "Recette familiale — وصفة عائلية";

async function login(page: import("@playwright/test").Page, email: string) {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: { origin: "http://127.0.0.1:3000" },
  });
  expect(response.ok()).toBe(true);
  await page.goto("/en/sell");
  await expect(page).toHaveURL(/\/en\/sell$/u);
}

async function logout(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
}

test("real seller and listing journey remains safe, localized and responsive", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await login(page, ownerEmail);

  await page.getByLabel("Seller display name").fill("Cuisine Amina مطبخ أمينة");
  await page
    .getByLabel("About your kitchen")
    .fill("Cuisine familiale — مطبخ عائلي");
  await page
    .locator('select[name="cityId"]')
    .selectOption({ label: "Casablanca" });
  await page.locator('select[name="areaId"]').selectOption({ label: "Maarif" });
  await page.getByLabel("Allow WhatsApp contact").check();
  await page.getByLabel("Contact phone").fill("+212 600000000");
  await page.getByRole("button", { name: "Create seller profile" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Cuisine Amina",
  );

  await page.getByRole("link", { name: "Add a listing" }).first().click();
  await page.getByLabel("Listing title").fill(authoredTitle);
  await page.getByLabel("Category").selectOption({ label: "Moroccan" });
  await page
    .locator('select[name="cityId"]')
    .selectOption({ label: "Casablanca" });
  await page.locator('select[name="areaId"]').selectOption({ label: "Maarif" });
  await page.getByLabel("Pickup available").check();
  await page.getByRole("button", { name: "Publish listing" }).click();
  await expect(page.locator(".form-notice[role=alert]")).toContainText(
    "positive price",
  );

  const photo = await sharp({
    create: { background: "#e94b35", channels: 3, height: 480, width: 640 },
  })
    .jpeg()
    .toBuffer();
  await page.getByLabel("Food photos").setInputFiles({
    buffer: photo,
    mimeType: "image/jpeg",
    name: "../../private-location-name.jpg",
  });
  await page.getByLabel("Listing title").fill(authoredTitle);
  await page.getByLabel("Description").fill(authoredDescription);
  await page.getByLabel("Price").fill("73.40");
  await page.getByLabel("Category").selectOption({ label: "Moroccan" });
  await page
    .locator('select[name="cityId"]')
    .selectOption({ label: "Casablanca" });
  await page.locator('select[name="areaId"]').selectOption({ label: "Maarif" });
  await page.getByLabel("Pickup available").check();
  await page.getByRole("button", { name: "Publish listing" }).click();

  await expect(page).toHaveURL(/\/en\/listing\//u);
  const listingUrl = new URL(page.url());
  const slug = listingUrl.pathname.split("/").at(-1)!;
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    authoredTitle,
  );
  await expect(page.getByText(authoredDescription)).toBeVisible();
  await expect(page.getByText(/73\.40/u)).toBeVisible();
  const publicImage = page.locator(".listing-gallery img").first();
  await expect
    .poll(() =>
      publicImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new RegExp(`/en/listing/${slug}$`, "u"),
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="fr"]'),
  ).toHaveAttribute("href", new RegExp(`/fr/listing/${slug}$`, "u"));
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await mkdir(".tmp/visual-qa-phase03", { recursive: true });
  await page.screenshot({
    fullPage: true,
    path: ".tmp/visual-qa-phase03/public-listing-desktop.png",
  });

  await page.getByRole("link", { name: "FR", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/fr/listing/${slug}$`, "u"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    authoredTitle,
  );
  await expect(page.getByText(authoredDescription)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voir le profil vendeur" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voir le profil vendeur" }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: authoredTitle }),
  ).toBeVisible();

  await page.goto("/fr/sell");
  const editLink = page.getByRole("link", { name: "Modifier" }).first();
  const editHref = await editLink.getAttribute("href");
  await editLink.click();
  await expect(page.getByLabel("Titre de l’annonce")).toHaveValue(
    authoredTitle,
  );
  await page.setViewportSize({ width: 320, height: 720 });
  await page
    .getByLabel("Description")
    .fill(`${authoredDescription} — modifiée`);
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page.getByRole("status")).toContainText("Annonce enregistrée");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    fullPage: true,
    path: ".tmp/visual-qa-phase03/edit-listing-320.png",
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/sell");
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("Paused")).toBeVisible();
  await page.goto(`/en/listing/${slug}`);
  await expect(
    page.getByRole("heading", { name: /Page not found|Page introuvable/u }),
  ).toBeVisible();
  await page.goto("/en/sell");
  await page.getByRole("button", { name: "Reactivate" }).click();
  await expect(page.getByText("Active")).toBeVisible();

  await logout(page);
  await login(page, otherEmail);
  await page.goto(editHref!);
  await expect(
    page.getByRole("heading", { name: /Page not found|Page introuvable/u }),
  ).toBeVisible();

  await logout(page);
  await login(page, ownerEmail);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Removed")).toBeVisible();
  await page.goto(`/en/listing/${slug}`);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
