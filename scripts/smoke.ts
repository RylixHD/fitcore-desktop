import { _electron as electron, expect } from "@playwright/test";
import { mkdtemp, mkdir } from "node:fs/promises";
import path from "node:path";
import { completeSetup } from "./onboarding-helpers";
const scratch = path.resolve(process.env.FITCORE_TEST_DIR ?? "../../work");
await mkdir(scratch, { recursive: true });
const data = await mkdtemp(path.join(scratch, "desktop-test-"));
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
let page = await app.firstWindow();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
await expect(
  page.getByRole("dialog", { name: "FITCORE’a hoş geldin" }),
).toBeVisible();
await completeSetup(page);
await page.evaluate(async () => {
  const s = await window.fitcore.load();
  for (const p of s.programs)
    await window.fitcore.action({
      type: "delete",
      collection: "programs",
      id: p.id,
    });
});
await page.reload();
await expect(
  page.getByRole("heading", { name: "İyi ki geldin, Ege." }),
).toBeVisible();
await page
  .getByRole("button", { name: "Antrenman Programım", exact: true })
  .click();
await page
  .getByRole("button", { name: "Program oluştur", exact: true })
  .click();
await page.getByLabel("Program adı").fill("Göğüs ve Triceps");
await page.getByRole("button", { name: "Programı kaydet" }).click();
await expect(
  page.getByRole("heading", { name: "Göğüs ve Triceps", exact: true }),
).toBeVisible();
await page.getByRole("button", { name: "Başlat", exact: true }).click();
await expect(
  page.getByText("0 / 3 set tamamlandı", { exact: false }),
).toBeVisible();
await page.getByRole("button", { name: "Set 1 tamamla", exact: true }).click();
await expect(
  page.getByText("1 / 3 set tamamlandı", { exact: false }),
).toBeVisible();
await page.getByRole("button", { name: "Duraklat", exact: true }).click();
await app.close();
app = await launch();
page = await app.firstWindow();
page.on("pageerror", (e) => errors.push(e.message));
await page
  .getByRole("button", { name: "Aktif Antrenman", exact: true })
  .click();
await expect(
  page.getByText("1 / 3 set tamamlandı", { exact: false }),
).toBeVisible();
await expect(
  page.getByRole("button", { name: "Devam et", exact: true }),
).toBeVisible();
await page.getByRole("button", { name: "Devam et", exact: true }).click();
page.on("dialog", (dialog) => dialog.accept());
await page
  .getByRole("button", { name: "Antrenmanı bitir", exact: true })
  .click();
await expect(
  page.getByRole("heading", { name: "Bir sonraki antrenmanın seni bekliyor" }),
).toBeVisible();
await page
  .getByRole("button", { name: "Beslenme Takibi", exact: true })
  .click();
await page.getByRole("button", { name: "Besin ekle", exact: true }).click();
await page.getByLabel("Besin / öğün adı").fill("Test öğünü");
await page.getByLabel("Kalori", { exact: true }).fill("400");
await page.getByLabel("Protein g", { exact: true }).fill("30");
await page.getByRole("button", { name: "Öğünü kaydet" }).click();
await expect(page.getByText("Test öğünü", { exact: true })).toBeVisible();
await page.getByRole("button", { name: "+250 ml", exact: true }).click();
await page.getByRole("button", { name: "Vücut Analizi", exact: true }).click();
await page.getByRole("button", { name: "Ölçüm ekle", exact: true }).click();
await page.getByLabel("Kilo kg", { exact: true }).fill("74.5");
await page.getByRole("button", { name: "Ölçümü kaydet", exact: true }).click();
await expect(
  page.getByRole("cell", { name: "74.5", exact: true }),
).toBeVisible();
await page.getByRole("button", { name: "Hedeflerim", exact: true }).click();
await page.getByRole("button", { name: "Hedef ekle", exact: true }).click();
await page.getByLabel("Hedef adı").fill("12 antrenman");
await page.getByLabel("Hedef değer", { exact: true }).fill("12");
await page.getByLabel("Birim", { exact: true }).fill("antrenman");
await page.getByRole("button", { name: "Hedefi kaydet", exact: true }).click();
await expect(
  page.getByRole("heading", { name: "12 antrenman", exact: true }),
).toBeVisible();
await page
  .getByRole("button", { name: "Takvim ve Hatırlatıcılar", exact: true })
  .click();
await page.getByRole("button", { name: "Hatırlatıcı", exact: true }).click();
await page.getByLabel("Bildirim metni").fill("Antrenman zamanı");
await page.getByRole("button", { name: "Hatırlatıcıyı kaydet" }).click();
await expect(page.getByText("Antrenman zamanı", { exact: true })).toBeVisible();
await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
await page.getByLabel("Tema", { exact: true }).selectOption("light");
await expect(page.locator(".app")).toHaveClass(/light/);
await page.getByLabel("Tema", { exact: true }).selectOption("dark");
for (const name of [
  "Vücut Analizi",
  "Gelişim İstatistikleri",
  "Hedeflerim",
  "Takvim ve Hatırlatıcılar",
  "Ayarlar",
  "Egzersiz Kütüphanesi",
  "Dashboard",
]) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
await page.screenshot({
  path: path.join(
    process.env.FITCORE_SCREENSHOT_DIR ?? "../../outputs",
    "FITCORE-dashboard.png",
  ),
  fullPage: true,
});
const result = await page.evaluate(async () => {
  const state = await window.fitcore.load();
  return {
    profile: state.profile?.name,
    completed: state.sessions.filter((x) => x.endedAt).length,
    done: state.sessions[0].sets.filter((x) => x.done).length,
    nutrition: state.nutrition.length,
    water: Object.values(state.water)[0],
  };
});
expect(result).toEqual({
  profile: "Ege",
  completed: 1,
  done: 1,
  nutrition: 1,
  water: 250,
});
expect(errors).toEqual([]);
console.log(
  JSON.stringify({
    desktop: "PASS",
    persistence: "PASS",
    pages: 10,
    result,
    errors,
  }),
);
await app.close();
