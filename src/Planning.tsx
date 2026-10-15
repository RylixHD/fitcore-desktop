import { useState } from "react";
import {
  Plus,
  Trash2,
  Trophy,
  Download,
  Upload,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, Empty, Field, Modal, Progress, Chart, formData } from "./ui";
import { uid, days, dateKey, volume, type Profile } from "./domain";
import { ProfileForm } from "./Health";
import type { PageProps } from "./Workouts";
export function Goals({ s, act }: PageProps) {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Bir hedef. Bir adım daha.</h2>
          <p>Kendi ölçütlerini belirle, ilerlemeni güncelle.</p>
        </div>
        <button className="primary" onClick={() => setShow(true)}>
          <Plus size={17} /> Hedef ekle
        </button>
      </div>
      <div className="grid three">
        {s.goals.map((g) => (
          <Card title={g.name} key={g.id} action={<Trophy size={18} />}>
            <div className="metric">
              {g.current}
              <small>
                {" "}
                / {g.target} {g.unit}
              </small>
            </div>
            <Progress value={(g.current / g.target) * 100} />
            <p>
              {g.current >= g.target
                ? "Hedef tamamlandı!"
                : `%${Math.round((g.current / g.target) * 100)} tamamlandı`}
            </p>
            <form
              className="actions"
              onSubmit={(e) => {
                const f = formData(e);
                void act({
                  type: "goal",
                  value: { ...g, current: Number(f.current) },
                });
              }}
            >
              <input
                aria-label="Güncel ilerleme"
                name="current"
                type="number"
                min="0"
                max="1000000"
                step="0.1"
                defaultValue={g.current}
                required
              />
              <button>Güncelle</button>
              <button
                type="button"
                aria-label="Hedefi sil"
                onClick={() => {
                  if (confirm("Hedef silinsin mi?"))
                    void act({ type: "delete", collection: "goals", id: g.id });
                }}
              >
                <Trash2 size={15} />
              </button>
            </form>
          </Card>
        ))}
      </div>
      {!s.goals.length && (
        <Card>
          <Empty title="Sıradaki başarını tanımla">
            <p>Örneğin: 12 antrenman tamamlamak veya 60 kg bench press.</p>
          </Empty>
        </Card>
      )}
      {show && (
        <Modal title="Yeni hedef" onClose={() => setShow(false)}>
          <form
            onSubmit={async (e) => {
              const f = formData(e);
              if (
                await act({
                  type: "goal",
                  value: {
                    id: uid(),
                    name: f.name,
                    target: Number(f.target),
                    current: Number(f.current),
                    unit: f.unit,
                  },
                })
              )
                setShow(false);
            }}
          >
            <Field label="Hedef adı">
              <input
                autoFocus
                required
                name="name"
                placeholder="Bu ay 12 antrenman"
              />
            </Field>
            <div className="grid three">
              <Field label="Hedef değer">
                <input
                  required
                  type="number"
                  name="target"
                  min="0.1"
                  max="1000000"
                  step="0.1"
                />
              </Field>
              <Field label="Mevcut değer">
                <input
                  required
                  type="number"
                  name="current"
                  min="0"
                  max="1000000"
                  step="0.1"
                  defaultValue="0"
                />
              </Field>
              <Field label="Birim">
                <input required name="unit" placeholder="antrenman / kg" />
              </Field>
            </div>
            <footer>
              <button className="primary">Hedefi kaydet</button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Calendar({ s, act }: PageProps) {
  const [show, setShow] = useState(false),
    [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
  const offset = (month.getDay() + 6) % 7,
    count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Takvimine hareket kat.</h2>
          <p>Programlar, geçmiş antrenmanlar ve yinelenen hatırlatıcılar.</p>
        </div>
        <button className="primary" onClick={() => setShow(true)}>
          <Plus size={17} /> Hatırlatıcı
        </button>
      </div>
      <div className="grid main-split">
        <Card
          title={month.toLocaleDateString("tr", {
            month: "long",
            year: "numeric",
          })}
          action={
            <div className="actions">
              <button
                aria-label="Önceki ay"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft size={16} />
              </button>
              <button
                aria-label="Sonraki ay"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight size={16} />
              </button>
            </div>
          }
        >
          <div className="calendar">
            {[1, 2, 3, 4, 5, 6, 0].map((x) => (
              <div className="day-name" key={x}>
                {days[x].slice(0, 3)}
              </div>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`empty${i}`} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const d = new Date(month.getFullYear(), month.getMonth(), i + 1),
                key = dateKey(d),
                done = s.sessions.filter(
                  (x) => x.endedAt && dateKey(new Date(x.startedAt)) === key,
                );
              return (
                <div
                  key={key}
                  className={`calendar-day ${key === dateKey() ? "today" : ""}`}
                >
                  <b>{i + 1}</b>
                  {s.programs
                    .filter((x) => x.day === d.getDay())
                    .map((p) => (
                      <small key={p.id} title={p.name}>
                        {p.name}
                      </small>
                    ))}
                  {done.map((x) => (
                    <small className="completed" key={x.id}>
                      ✓ {x.name}
                    </small>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Hatırlatıcılar" action={<Bell size={18} />}>
          <p>
            Pencere kapalıyken sistem tepsisinde çalışır. Bilgisayar kapalıyken
            veya uygulamadan tamamen çıkıldığında bildirim gönderilmez.
          </p>
          {s.reminders.map((r) => (
            <div className="reminder" key={r.id}>
              <div>
                <b>{r.time}</b>
                <span>{r.title}</span>
                <small>
                  {r.days.map((x) => days[x].slice(0, 3)).join(" · ")}
                </small>
              </div>
              <label className="check">
                <input
                  aria-label={`${r.title} etkin`}
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) =>
                    void act({
                      type: "reminder",
                      value: { ...r, enabled: e.target.checked },
                    })
                  }
                />
              </label>
              <button
                aria-label="Hatırlatıcıyı sil"
                onClick={() =>
                  void act({
                    type: "delete",
                    collection: "reminders",
                    id: r.id,
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!s.reminders.length && <Empty title="Henüz hatırlatıcı yok" />}
        </Card>
      </div>
      {show && (
        <Modal title="Tekrarlanan hatırlatıcı" onClose={() => setShow(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await act({
                  type: "reminder",
                  value: {
                    id: uid(),
                    title: f.get("title"),
                    time: f.get("time"),
                    days: f.getAll("days").map(Number),
                    enabled: true,
                    lastFired: "",
                  },
                })
              )
                setShow(false);
            }}
          >
            <Field label="Bildirim metni">
              <input
                autoFocus
                required
                name="title"
                placeholder="Antrenman zamanın geldi!"
              />
            </Field>
            <Field label="Saat">
              <input required type="time" name="time" defaultValue="18:00" />
            </Field>
            <div className="tabs">
              {days.map((x, i) => (
                <label className="check" key={x}>
                  <input name="days" type="checkbox" value={i} defaultChecked />
                  {x.slice(0, 3)}
                </label>
              ))}
            </div>
            <footer>
              <button className="primary">Hatırlatıcıyı kaydet</button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Stats({ s, file }: PageProps) {
  const sessions = s.sessions
    .filter((x) => x.endedAt)
    .sort((a, b) => a.startedAt - b.startedAt);
  const [exercise, setExercise] = useState(s.exercises[0].id);
  const exSessions = sessions.filter((x) =>
    x.sets.some((st) => st.exerciseId === exercise && st.done),
  );
  const recent = sessions.filter(
      (x) => x.startedAt >= Date.now() - 7 * 86400000,
    ),
    previous = sessions.filter(
      (x) =>
        x.startedAt >= Date.now() - 14 * 86400000 &&
        x.startedAt < Date.now() - 7 * 86400000,
    );
  const v = recent.reduce((a, x) => a + volume(x), 0),
    pv = previous.reduce((a, x) => a + volume(x), 0);
  const muscles = [...new Set(s.exercises.map((x) => x.muscle))],
    missing = muscles.filter(
      (m) =>
        !sessions
          .filter((x) => x.startedAt > Date.now() - 14 * 86400000)
          .some((x) =>
            x.sets.some(
              (st) =>
                st.done &&
                s.exercises.find((e) => e.id === st.exerciseId)?.muscle === m,
            ),
          ),
    );
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Emek, veriye dönüşüyor.</h2>
          <p>Yalnızca kaydettiğin ve tamamladığın setlerden hesaplanır.</p>
        </div>
        <button onClick={() => void file("pdf")}>
          <FileText size={17} /> PDF raporu
        </button>
      </div>
      <div className="grid two">
        <Card title="Antrenman hacmi">
          <Chart
            unit="kg"
            data={sessions.map((x) => ({
              name: dateKey(new Date(x.startedAt)).slice(5),
              value: volume(x),
            }))}
          />
        </Card>
        <Card
          title="Kişisel rekor trendi"
          action={
            <select
              aria-label="İstatistik egzersizi"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
            >
              {s.exercises.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          }
        >
          <Chart
            unit="kg"
            color="#a9a0ff"
            data={exSessions.map((x) => ({
              name: dateKey(new Date(x.startedAt)).slice(5),
              value: Math.max(
                ...x.sets
                  .filter((st) => st.done && st.exerciseId === exercise)
                  .map((st) => st.weight),
              ),
            }))}
          />
        </Card>
      </div>
      <Card title="Verilerinin söylediği">
        <div className="grid three">
          <div className="insight">
            <b>Son 7 gün: {recent.length} antrenman</b>
            <p>
              {s.profile
                ? `Haftalık ${s.profile.frequency} antrenman hedefinin %${Math.min(100, Math.round((recent.length / s.profile.frequency) * 100))} kadarı kaydedildi.`
                : "Haftalık kişisel hedef henüz belirlenmedi."}
            </p>
          </div>
          <div className="insight">
            <b>Hacim: {v.toLocaleString("tr")} kg</b>
            <p>
              {pv
                ? `Önceki 7 güne göre %${Math.round(((v - pv) / pv) * 100)} değişim.`
                : "Karşılaştırma için önceki haftada tamamlanmış set gerekiyor."}
            </p>
          </div>
          <div className="insight">
            <b>Kas grubu dengesi</b>
            <p>
              {missing.length
                ? `Son 14 günde kayıt bulunmayan gruplar: ${missing.join(", ")}. Programını gözden geçirebilirsin.`
                : "Son 14 günde tüm kütüphane kas gruplarında kayıt var."}
            </p>
          </div>
        </div>
      </Card>
      <Card title="Antrenman geçmişi">
        {[...sessions].reverse().map((x) => (
          <details key={x.id}>
            <summary>
              <span>{x.name}</span>
              <span>
                {dateKey(new Date(x.startedAt))} ·{" "}
                {x.sets.filter((st) => st.done).length}/{x.sets.length} set ·{" "}
                {volume(x)} kg
              </span>
            </summary>
            <p>{x.notes || "Not eklenmedi."}</p>
            {x.sets.map((st, i) => (
              <div className="history-set" key={st.id}>
                {i + 1}. {s.exercises.find((e) => e.id === st.exerciseId)?.name}{" "}
                · {st.weight} kg × {st.reps} ·{" "}
                {st.done ? "Tamamlandı" : "Tamamlanmadı"}
              </div>
            ))}
          </details>
        ))}
        {!sessions.length && <Empty title="İlk antrenmanınla başlayacak" />}
      </Card>
    </>
  );
}
export function Settings({ s, act, file, go }: PageProps) {
  const [profile, setProfile] = useState(false);
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Sana göre FITCORE.</h2>
          <p>Görünümünü, tercihlerini ve verilerini yönet.</p>
        </div>
      </div>
      <div className="grid two">
        <Card title="Görünüm ve davranış">
          <Field label="Tema">
            <select
              value={s.settings.theme}
              onChange={(e) =>
                void act({
                  type: "settings",
                  value: { ...s.settings, theme: e.target.value },
                })
              }
            >
              <option value="dark">Koyu</option>
              <option value="light">Açık</option>
            </select>
          </Field>
          <Field label="Vurgu rengi">
            <select
              value={s.settings.accent}
              onChange={(e) =>
                void act({
                  type: "settings",
                  value: { ...s.settings, accent: e.target.value },
                })
              }
            >
              <option value="lime">Elektrik yeşili</option>
              <option value="blue">Mavi</option>
              <option value="purple">Mor</option>
            </select>
          </Field>
          {(["notifications", "tray", "startup", "compact"] as const).map(
            (key, i) => (
              <label className="setting-row" key={key}>
                <span>
                  {
                    [
                      "Windows bildirimleri",
                      "Pencere kapanınca sistem tepsisinde çalış",
                      "Windows açıldığında başlat (kurulu sürüm)",
                      "Dashboard: kompakt görünüm",
                    ][i]
                  }
                </span>
                <input
                  type="checkbox"
                  checked={s.settings[key]}
                  onChange={(e) =>
                    void act({
                      type: "settings",
                      value: { ...s.settings, [key]: e.target.checked },
                    })
                  }
                />
              </label>
            ),
          )}
        </Card>
        <Card title="Yerel profil">
          <div className="profile-avatar">
            {s.profile?.name.slice(0, 1).toLocaleUpperCase("tr")}
          </div>
          <h2>{s.profile?.name || "Misafir"}</h2>
          <p>
            {s.profile
              ? `${s.profile.frequency} antrenman / hafta · ${s.profile.calories} kcal hedef`
              : "Kişisel bilgi ve hedef girmeden kullanıyorsun."}
          </p>
          <div className="actions wrap">
            {s.profile && (
              <button onClick={() => setProfile(true)}>Profili düzenle</button>
            )}
            <button onClick={() => go("setup")}>
              Kişisel kurulumu yeniden yap
            </button>
          </div>
          <div className="notice">
            <p>
              Verilerin bu bilgisayardaki SQLite veritabanında saklanır. Bulut
              hesabı veya API anahtarı gerekmez. Yerel veritabanı şifrelenmez;
              bilgisayar hesabının erişim izinleriyle korunur.
            </p>
          </div>
        </Card>
        <Card title="Veri yönetimi">
          <div className="actions wrap">
            <button onClick={() => void file("backup")}>
              <Download size={17} /> JSON yedekle
            </button>
            <button onClick={() => void file("restore")}>
              <Upload size={17} /> Yedeği geri yükle
            </button>
            <button onClick={() => void file("csv")}>
              <Download size={17} /> Antrenman CSV
            </button>
            <button onClick={() => void file("pdf")}>
              <FileText size={17} /> PDF raporu
            </button>
          </div>
          <button className="danger" onClick={() => void file("reset")}>
            <Trash2 size={17} /> Tüm kişisel verileri sil
          </button>
          <p>
            Yedek tüm profil, beslenme, ölçüm ve antrenman kayıtlarını içerir.
            Geri yükleme öncesinde mevcut verilerin güvenlik kopyası alınır.
          </p>
        </Card>
        <Card title="Kısayollar ve sürüm">
          <p>
            <kbd>Ctrl</kbd> + <kbd>K</kbd> Egzersiz ara
          </p>
          <p>
            <kbd>Ctrl</kbd> + <kbd>1</kbd> Dashboard
          </p>
          <p>
            <kbd>Ctrl</kbd> + <kbd>2</kbd> Aktif antrenman
          </p>
          <p>FITCORE 0.2.0 · Yerel ilk sürüm</p>
          <small>
            3D animasyon varlıkları, OCR ve otomatik öğün önerileri bu sürümde
            yoktur.
          </small>
        </Card>
      </div>
      {profile && (
        <Modal title="Profilini düzenle" onClose={() => setProfile(false)}>
          <ProfileForm
            initial={s.profile}
            onSave={async (p: Profile) => {
              const ok = await act({ type: "profile", value: p });
              if (ok) setProfile(false);
              return ok;
            }}
          />
        </Modal>
      )}
    </>
  );
}
