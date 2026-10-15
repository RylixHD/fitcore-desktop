import { _electron as electron, expect } from "@playwright/test";
import { mkdtemp, mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
const scratch = path.resolve(process.env.FITCORE_TEST_DIR ?? "../../work");
await mkdir(scratch, { recursive: true });
const data = await mkdtemp(path.join(scratch, "files-test-"));
const app = await electron.launch({
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
try {
  const page = await app.firstWindow();
  await page.waitForFunction(() => Boolean(window.fitcore));
  await app.evaluate(({ dialog }) => {
    dialog.showMessageBox = (async () => ({
      response: 1,
      checkboxChecked: false,
    })) as any;
  });
  const saveTo = async (file: string) =>
    app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = (async () => ({
        canceled: false,
        filePath: file,
      })) as any;
    }, file);
  const openFrom = async (file: string) =>
    app.evaluate(({ dialog }, file) => {
      dialog.showOpenDialog = (async () => ({
        canceled: false,
        filePaths: [file],
      })) as any;
    }, file);
  await page.evaluate(async () => {
    await window.fitcore.action({
      type: "program",
      value: {
        id: "p",
        name: "Test",
        day: 1,
        notes: "",
        items: [
          {
            id: "i",
            exerciseId: "bench",
            sets: 2,
            reps: 10,
            weight: 40,
            rest: 90,
          },
        ],
      },
    });
    await window.fitcore.action({ type: "start", id: "p" });
    const s = await window.fitcore.load();
    await window.fitcore.action({
      type: "set",
      id: s.sessions[0].sets[0].id,
      done: true,
      weight: 40,
      reps: 10,
    });
    await window.fitcore.action({ type: "finish" });
  });
  const backup = path.join(data, "backup.json");
  await saveTo(backup);
  await page.evaluate(() => window.fitcore.file("backup"));
  expect(JSON.parse(await readFile(backup, "utf8")).sessions).toHaveLength(1);
  const csv = path.join(data, "report.csv");
  await saveTo(csv);
  await page.evaluate(() => window.fitcore.file("csv"));
  expect(await readFile(csv, "utf8")).toContain("Bench Press");
  const pdf = path.join(data, "report.pdf");
  await saveTo(pdf);
  await page.evaluate(() => window.fitcore.file("pdf"));
  expect((await readFile(pdf)).subarray(0, 4).toString()).toEqual("%PDF");
  expect((await stat(pdf)).size).toBeGreaterThan(1000);
  const txt = path.join(data, "program.txt");
  await writeFile(txt, "Bench Press 4 x 10 40 kg");
  await openFrom(txt);
  expect(await page.evaluate(() => window.fitcore.file("import"))).toContain(
    "Bench Press 4 x 10",
  );
  const book = new ExcelJS.Workbook();
  book.addWorksheet("Program").addRow(["Bench Press", 4, 10, 40]);
  const xlsx = path.join(data, "program.xlsx");
  await book.xlsx.writeFile(xlsx);
  await openFrom(xlsx);
  expect(await page.evaluate(() => window.fitcore.file("import"))).toContain(
    "Bench Press 4 x 10 40",
  );
  await openFrom(pdf);
  expect(await page.evaluate(() => window.fitcore.file("import"))).toContain(
    "FITCORE",
  );
  const bad = path.join(data, "bad.json");
  await writeFile(bad, '{"version":99}');
  await openFrom(bad);
  const rejected = await page.evaluate(async () => {
    try {
      await window.fitcore.file("restore");
      return false;
    } catch {
      return true;
    }
  });
  expect(rejected).toBe(true);
  expect(
    await page.evaluate(
      async () => (await window.fitcore.load()).sessions.length,
    ),
  ).toBe(1);
  await page.evaluate(() =>
    window.fitcore.action({ type: "delete", collection: "programs", id: "p" }),
  );
  await openFrom(backup);
  await page.evaluate(() => window.fitcore.file("restore"));
  expect(
    await page.evaluate(
      async () => (await window.fitcore.load()).programs.length,
    ),
  ).toBe(1);
  console.log(
    JSON.stringify({
      backup: "PASS",
      restore: "PASS",
      invalidRestore: "PASS",
      csv: "PASS",
      pdf: "PASS",
      importTXT: "PASS",
      importXLSX: "PASS",
      importPDF: "PASS",
    }),
  );
} finally {
  await app.close();
}
