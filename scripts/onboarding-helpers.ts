import { expect, type Page } from "@playwright/test";
export async function completeSetup(
  page: Page,
  mode: "auto" | "import" = "auto",
) {
  const next = () =>
    page.getByRole("button", { name: "Devam", exact: true }).click();
  await page.getByLabel("İsmin", { exact: true }).fill("Ege");
  await page.getByLabel("Yaşın", { exact: true }).fill("25");
  await next();
  await page.getByLabel("Boyun (cm)", { exact: true }).fill("175");
  await page.getByLabel("Mevcut kilon (kg)", { exact: true }).fill("75");
  await page.getByLabel("Hedef kilon (kg)", { exact: true }).fill("72");
  await next();
  await next();
  await next();
  if (mode === "auto") {
    await page
      .getByRole("button", { name: "Kişisel programımı oluştur", exact: true })
      .click();
    await expect(
      page.getByText("Bu program neden böyle?", { exact: true }),
    ).toBeVisible();
  } else {
    await page
      .getByRole("button", { name: "Programım var", exact: false })
      .click();
    await page
      .getByLabel("Program metni", { exact: true })
      .fill(
        "Bench Press 4 x 10 40 kg\nBiceps Curl 3 x 12 10 kg\nBilinmeyen 3 x 10",
      );
    await page
      .getByRole("button", { name: "Analiz et ve güne ekle", exact: true })
      .click();
    await expect(
      page.getByText("Eklenmeyen satırlar:", { exact: false }),
    ).toBeVisible();
  }
  await next();
  await expect(
    page.getByRole("button", { name: "Kişisel alanımı oluştur", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Bilgilerimi ve programı kontrol ettim.", { exact: false })
    .check();
  await page
    .getByRole("button", { name: "Kişisel alanımı oluştur", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "İyi ki geldin, Ege." }),
  ).toBeVisible();
}
