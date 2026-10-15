import { _electron as electron, expect } from "@playwright/test";
import { mkdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import { completeSetup } from "./onboarding-helpers";
const scratch = path.resolve(process.env.FITCORE_TEST_DIR ?? "../../work");
await mkdir(scratch, { recursive: true });
const data = await mkdtemp(path.join(scratch, "guest-test-"));
const launch = () =>
  electron.launch({
    executablePath: process.env.FITCORE_EXECUTABLE,
    args: [
      ...(process.env.FITCORE_TEST_CONTAINER
        ? ["--no-sandbox", "--disable-gpu"]
        : []),
      ...(process.env.FITCORE_EXECUTABLE ? [] : ["."]),
    ],
    env: { ...process.env, FITCORE_DATA_DIR: data },
    timeout: 60000,
  });
let app = await launch();
const errors: string[] = [];
try {
  let page = await app.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.screenshot({
    path: path.join(
      process.env.FITCORE_SCREENSHOT_DIR ?? "../../outputs",
      "FITCORE-karsilama.png",
    ),
  });
  await page
    .getByRole("button", {
      name: "Hepsini atla · Misafir olarak devam et",
      exact: false,
    })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const name of [
    "Dashboard",
    "Antrenman Programım",
    "Aktif Antrenman",
    "Egzersiz Kütüphanesi",
    "Beslenme Takibi",
    "Vücut Analizi",
    "Gelişim İstatistikleri",
    "Hedeflerim",
    "Takvim ve Hatırlatıcılar",
    "Ayarlar",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator("main").innerText()).not.toMatch(
      /NaN|Infinity|undefined/,
    );
  }
  expect(
    await page.evaluate(async () => {
      const s = await window.fitcore.load();
      return {
        guest: s.guest,
        profile: s.profile,
        measurements: s.measurements.length,
      };
    }),
  ).toEqual({ guest: true, profile: null, measurements: 0 });
  await page
    .getByRole("button", { name: "Beslenme Takibi", exact: true })
    .click();
  await page.getByRole("button", { name: "+250 ml", exact: true }).click();
  await app.close();
  app = await launch();
  page = await app.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(
    page.getByRole("heading", { name: "İyi ki geldin." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await page
    .getByRole("button", { name: "Kişisel kurulumu yeniden yap", exact: true })
    .click();
  await completeSetup(page, "import");
  expect(
    await page.evaluate(async () => {
      const s = await window.fitcore.load();
      return {
        guest: s.guest,
        programs: s.programs.length,
        items: s.programs[0].items.length,
        source: s.profile?.setup?.source,
        water: Object.values(s.water)[0],
      };
    }),
  ).toEqual({
    guest: false,
    programs: 1,
    items: 2,
    source: "import",
    water: 250,
  });
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await page
    .getByRole("button", { name: "Kişisel kurulumu yeniden yap", exact: true })
    .click();
  await expect(page.getByLabel("İsmin", { exact: true })).toHaveValue("Ege");
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify({
      guest: "PASS",
      guestPages: 10,
      restart: "PASS",
      upgradeToProfile: "PASS",
      importPreview: "PASS",
      preservedWater: "PASS",
      errors,
    }),
  );
} finally {
  await app.close();
}
