import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Notification,
  Tray,
  Menu,
  nativeImage,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { Repository } from "./database";
import {
  activeSession,
  dateKey,
  reduce,
  validateState,
  volume,
  initialState,
} from "../src/domain";
const base = path.dirname(fileURLToPath(import.meta.url));
if (process.env.FITCORE_DATA_DIR)
  app.setPath("userData", process.env.FITCORE_DATA_DIR);
let win: BrowserWindow,
  repo: Repository,
  tray: Tray,
  quitting = false;
let notifiedRest: number | null = null;
const entry = path.join(base, "../dist/index.html");
app.setAppUserModelId("com.fitcore.desktop");
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    win?.show();
    win?.focus();
  });
  app.whenReady().then(() => {
    repo = new Repository(path.join(app.getPath("userData"), "fitcore.sqlite"));
    win = new BrowserWindow({
      width: 1440,
      height: 960,
      minWidth: 1040,
      minHeight: 720,
      title: "FITCORE",
      backgroundColor: "#101214",
      show: false,
      webPreferences: {
        preload: path.join(base, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    win.setMenuBarVisibility(false);
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.webContents.on("will-navigate", (e) => e.preventDefault());
    win.webContents.session.setPermissionRequestHandler(
      (_web, _permission, callback) => callback(false),
    );
    const guard = (event: Electron.IpcMainInvokeEvent) => {
      if (
        event.sender !== win.webContents ||
        event.senderFrame !== win.webContents.mainFrame
      )
        throw Error("Yetkisiz istek.");
    };
    ipcMain.handle("load", (event) => {
      guard(event);
      return repo.load();
    });
    ipcMain.handle("action", (event, input) => {
      guard(event);
      if (JSON.stringify(input).length > 100000)
        throw Error("İstek çok büyük.");
      const next = reduce(repo.load(), input);
      if (input.type === "settings") {
        if (app.isPackaged)
          app.setLoginItemSettings({
            openAtLogin: next.settings.startup,
            path: app.getPath("exe"),
          });
        else if (next.settings.startup)
          throw Error("Otomatik başlatma kurulu sürümde kullanılabilir.");
      }
      repo.save(next);
      return next;
    });
    ipcMain.handle("file", async (event, op) => {
      guard(event);
      if (!["backup", "restore", "csv", "pdf", "import", "reset"].includes(op))
        throw Error("Geçersiz işlem.");
      if (op === "reset") {
        const answer = await dialog.showMessageBox(win, {
          type: "warning",
          message: "Tüm kişisel FITCORE verileri silinsin mi?",
          detail:
            "Profil, antrenmanlar, beslenme, ölçümler ve hatırlatıcılar silinir. Dışa aktardığın yedekler etkilenmez. Bu işlem geri alınamaz.",
          buttons: ["Vazgeç", "Tüm verileri sil"],
          defaultId: 0,
          cancelId: 0,
        });
        if (answer.response !== 1) return null;
        repo.db.exec("PRAGMA secure_delete=ON;");
        repo.save(initialState());
        repo.db.exec("VACUUM; PRAGMA wal_checkpoint(TRUNCATE);");
        for (const name of await fs.readdir(app.getPath("userData"))) {
          if (/^before-restore-\d+\.json$/.test(name))
            await fs.unlink(path.join(app.getPath("userData"), name));
        }
        if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: false });
        return "Kişisel veriler silindi.";
      }
      if (op === "import" || op === "restore") {
        const result = await dialog.showOpenDialog(win, {
          properties: ["openFile"],
          filters: [
            op === "restore"
              ? { name: "FITCORE yedeği", extensions: ["json"] }
              : {
                  name: "Antrenman programı",
                  extensions: ["txt", "csv", "pdf", "xlsx"],
                },
          ],
        });
        if (result.canceled) return null;
        const file = result.filePaths[0];
        if ((await fs.stat(file)).size > 20 * 1024 * 1024)
          throw Error("Dosya 20 MB sınırını aşıyor.");
        if (op === "restore") {
          const next = validateState(
            JSON.parse(await fs.readFile(file, "utf8")),
          );
          const answer = await dialog.showMessageBox(win, {
            type: "warning",
            message: "Yedekteki veriler mevcut kayıtların yerini alacak.",
            detail:
              "Mevcut verilerin otomatik güvenlik kopyası uygulama veri klasörüne kaydedilecek.",
            buttons: ["Vazgeç", "Geri yükle"],
            defaultId: 0,
            cancelId: 0,
          });
          if (answer.response !== 1) return null;
          await fs.writeFile(
            path.join(
              app.getPath("userData"),
              `before-restore-${Date.now()}.json`,
            ),
            JSON.stringify(repo.load()),
          );
          next.settings.startup = repo.load().settings.startup;
          repo.save(next);
          return "Veriler geri yüklendi.";
        }
        if (file.toLowerCase().endsWith(".pdf")) {
          const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
          const result = await pdf(await fs.readFile(file));
          if (!result.text.trim())
            throw Error(
              "PDF metin içermiyor. Taranmış PDF için OCR desteklenmiyor.",
            );
          return result.text;
        }
        if (file.toLowerCase().endsWith(".xlsx")) {
          const ExcelJS = (await import("exceljs")).default;
          const book = new ExcelJS.Workbook();
          await book.xlsx.readFile(file);
          const lines: string[] = [];
          book.eachSheet((sheet) =>
            sheet.eachRow((row) => {
              const cells = (row.values as unknown[])
                .slice(1)
                .map((x) =>
                  typeof x === "object" && x !== null ? "" : String(x ?? ""),
                );
              if (
                cells.length >= 3 &&
                /^\d+$/.test(cells[1]) &&
                /^\d+$/.test(cells[2])
              )
                lines.push(
                  `${cells[0]} ${cells[1]} x ${cells[2]} ${cells[3] ?? ""}`,
                );
              else lines.push(cells.join(" "));
            }),
          );
          return lines.join("\n");
        }
        return fs.readFile(file, "utf8");
      }
      const ext = op === "backup" ? "json" : op === "csv" ? "csv" : "pdf";
      const result = await dialog.showSaveDialog(win, {
        defaultPath: `FITCORE-${dateKey()}.${ext}`,
        filters: [{ name: "FITCORE", extensions: [ext] }],
      });
      if (result.canceled || !result.filePath) return null;
      const s = repo.load();
      if (op === "backup")
        await fs.writeFile(result.filePath, JSON.stringify(s, null, 2));
      if (op === "csv") {
        const esc = (x: unknown) =>
          `"${String(x)
            .replace(/"/g, '""')
            .replace(/^[=+@-]/, "'$&")}"`;
        const rows = [
          [
            "Tarih",
            "Antrenman",
            "Egzersiz",
            "Tekrar",
            "Ağırlık kg",
            "Tamamlandı",
          ],
          ...s.sessions.flatMap((se) =>
            se.sets.map((st) => [
              dateKey(new Date(se.startedAt)),
              se.name,
              s.exercises.find((e) => e.id === st.exerciseId)?.name,
              st.reps,
              st.weight,
              st.done ? "Evet" : "Hayır",
            ]),
          ),
        ];
        await fs.writeFile(
          result.filePath,
          "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\r\n"),
        );
      }
      if (op === "pdf") {
        const escape = (v: unknown) =>
          String(v).replace(
            /[&<>"']/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[c]!,
          );
        const report = new BrowserWindow({
          show: false,
          webPreferences: {
            sandbox: true,
            nodeIntegration: false,
            contextIsolation: true,
          },
        });
        try {
          await report.loadURL(
            "data:text/html;charset=utf-8," +
              encodeURIComponent(
                `<html lang="tr"><meta charset="UTF-8"><style>body{font:14px Arial;margin:48px;color:#182127}h1{font-size:32px}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}table{width:100%;border-collapse:collapse}</style><h1>FITCORE / Gelişim raporu</h1><p>${escape(s.profile?.name ?? "")} · ${dateKey()}</p><p>${s.sessions.filter((x) => x.endedAt).length} bitirilen antrenman · ${s.sessions.filter((x) => x.endedAt).reduce((a, x) => a + volume(x), 0)} kg toplam hacim</p><h2>Vücut ölçümleri</h2><table><tr><th>Tarih</th><th>Kilo</th><th>Bel</th><th>Yağ oranı</th></tr>${s.measurements.map((x) => `<tr><td>${escape(x.date)}</td><td>${x.weight} kg</td><td>${x.waist || "—"} cm</td><td>${x.bodyFat || "—"} %</td></tr>`).join("")}</table><h2>Antrenmanlar</h2>${s.sessions
                  .filter((x) => x.endedAt)
                  .map(
                    (x) =>
                      `<p>${dateKey(new Date(x.startedAt))} · ${escape(x.name)} · ${x.sets.filter((st) => st.done).length}/${x.sets.length} set · ${volume(x)} kg</p>`,
                  )
                  .join("")}</html>`,
              ),
          );
          await fs.writeFile(
            result.filePath,
            await report.webContents.printToPDF({
              printBackground: true,
              pageSize: "A4",
            }),
          );
        } finally {
          report.destroy();
        }
      }
      return "Dosya kaydedildi.";
    });
    win.on("close", (e) => {
      if (!quitting && repo.load().settings.tray) {
        e.preventDefault();
        win.hide();
      }
    });
    // Windows tray uses a raster image, generated locally without external assets.
    const pixels = Buffer.alloc(32 * 32 * 4);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4;
        const glyph =
          (x >= 9 && x < 14 && y >= 7 && y < 26) ||
          (x >= 9 && x < 25 && y >= 7 && y < 12) ||
          (x >= 9 && x < 22 && y >= 15 && y < 20);
        pixels[i] = glyph ? 14 : 107;
        pixels[i + 1] = glyph ? 35 : 239;
        pixels[i + 2] = glyph ? 23 : 180;
        pixels[i + 3] = 255;
      }
    tray = new Tray(
      nativeImage.createFromBitmap(pixels, { width: 32, height: 32 }),
    );
    tray.setToolTip("FITCORE · Hatırlatıcılar etkin");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "FITCORE’u aç", click: () => win.show() },
        {
          label: "Tamamen çık",
          click: () => {
            quitting = true;
            app.quit();
          },
        },
      ]),
    );
    tray.on("double-click", () => win.show());
    setInterval(() => {
      const s = repo.load(),
        now = new Date(),
        key = dateKey(now),
        time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      let changed = false;
      const notify = (title: string, body: string) => {
        if (s.settings.notifications && Notification.isSupported())
          new Notification({ title, body }).show();
      };
      for (const r of s.reminders) {
        if (
          r.enabled &&
          s.settings.notifications &&
          r.days.includes(now.getDay()) &&
          r.time === time &&
          r.lastFired !== key
        ) {
          r.lastFired = key;
          changed = true;
          notify("FITCORE · Hatırlatıcı", r.title);
        }
      }
      const a = activeSession(s);
      if (
        a?.restUntil &&
        a.pausedAt === null &&
        a.restUntil <= Date.now() &&
        notifiedRest !== a.restUntil
      ) {
        notifiedRest = a.restUntil;
        notify("Dinlenme tamamlandı", "Hazır olduğunda sıradaki sete geç.");
        a.restUntil = null;
        changed = true;
      }
      if (changed) repo.save(s);
    }, 1000).unref();
    win.loadFile(entry);
    win.once("ready-to-show", () => win.show());
  });
  app.on("before-quit", () => {
    quitting = true;
  });
  app.on("will-quit", () => repo?.close());
}
