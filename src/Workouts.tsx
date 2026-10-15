import { useState, lazy, Suspense } from "react";
import { animationAssets } from "./animation-assets";
const ExerciseViewer = lazy(() => import("./ExerciseViewer"));
import {
  Plus,
  Play,
  Trash2,
  Upload,
  Pause,
  Check,
  Save,
  Copy,
  Timer,
  Box,
  Search,
} from "lucide-react";
import {
  type State,
  type Program,
  activeSession,
  uid,
  days,
  elapsed,
  volume,
  parseProgram,
} from "./domain";
import { Card, Empty, Field, Modal, Progress } from "./ui";
export type PageProps = {
  s: State;
  act: (a: unknown) => Promise<boolean>;
  file: (op: string) => Promise<string | null>;
  go: (p: string) => void;
  now: number;
  search: string;
};
export function Programs({ s, act, file, go }: PageProps) {
  const [edit, setEdit] = useState<Program | null>(null),
    [raw, setRaw] = useState(""),
    [warnings, setWarnings] = useState<string[]>([]);
  const fresh = (): Program => ({
    id: uid(),
    name: "Yeni antrenman",
    day: new Date().getDay(),
    notes: "",
    items: [
      {
        id: uid(),
        exerciseId: "bench",
        sets: 3,
        reps: 10,
        weight: 0,
        rest: 90,
      },
    ],
  });
  const patch = (i: number, value: object) =>
    setEdit((p) =>
      p
        ? {
            ...p,
            items: p.items.map((x, j) => (i === j ? { ...x, ...value } : x)),
          }
        : p,
    );
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Planını kur. Ritmini bul.</h2>
          <p>Haftalık programların ve tekrar kullanabileceğin şablonların.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEdit(fresh());
            setRaw("");
            setWarnings([]);
          }}
        >
          <Plus size={17} /> Program oluştur
        </button>
      </div>
      <div className="week-strip">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className={d === new Date().getDay() ? "today" : ""}>
            <span>{days[d].slice(0, 3)}</span>
            <strong>
              {s.programs.filter((x) => x.day === d).length || "—"}
            </strong>
            <small>antrenman</small>
          </div>
        ))}
      </div>
      <div className="grid two">
        {s.programs.map((p) => (
          <Card
            key={p.id}
            title={p.name}
            action={<span className="tag">{days[p.day]}</span>}
          >
            <div className="exercise-list">
              {p.items.map((i) => (
                <div key={i.id}>
                  <span>
                    {s.exercises.find((e) => e.id === i.exerciseId)?.name}
                  </span>
                  <b>
                    {i.sets} × {i.reps} <small>· {i.weight} kg</small>
                  </b>
                </div>
              ))}
            </div>
            <p>{p.notes}</p>
            <div className="actions">
              <button
                className="primary"
                onClick={async () => {
                  if (await act({ type: "start", id: p.id })) go("active");
                }}
              >
                <Play size={15} /> Başlat
              </button>
              <button
                onClick={() => {
                  setEdit(structuredClone(p));
                  setRaw("");
                  setWarnings([]);
                }}
              >
                Düzenle
              </button>
              <button
                title="Şablonu çoğalt"
                onClick={() =>
                  setEdit({
                    ...structuredClone(p),
                    id: uid(),
                    name: p.name + " · Kopya",
                    items: p.items.map((x) => ({ ...x, id: uid() })),
                  })
                }
              >
                <Copy size={16} />
              </button>
              <button
                aria-label={`${p.name} programını sil`}
                onClick={() => {
                  if (
                    confirm(
                      "Program silinsin mi? Geçmiş antrenmanların korunur.",
                    )
                  )
                    void act({
                      type: "delete",
                      collection: "programs",
                      id: p.id,
                    });
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>
      {!s.programs.length && (
        <Card>
          <Empty title="İlk programına yer açtık">
            <p>
              Egzersizlerini seç, setlerini belirle. Ya da mevcut programını içe
              aktar.
            </p>
            <button
              onClick={() => {
                setEdit(fresh());
                setRaw("");
                setWarnings([]);
              }}
            >
              İlk programı oluştur
            </button>
          </Empty>
        </Card>
      )}
      {edit && (
        <Modal title="Antrenman programı" onClose={() => setEdit(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act({ type: "program", value: edit })) setEdit(null);
            }}
          >
            <div className="grid two">
              <Field label="Program adı">
                <input
                  autoFocus
                  required
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </Field>
              <Field label="Antrenman günü">
                <select
                  value={edit.day}
                  onChange={(e) => setEdit({ ...edit, day: +e.target.value })}
                >
                  {days.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="import-box">
              <div className="actions">
                <b>Dosyadan veya metinden aktar</b>
                <button
                  type="button"
                  onClick={async () => {
                    const t = await file("import");
                    if (t) setRaw(t);
                  }}
                >
                  <Upload size={15} /> PDF / Excel / TXT
                </button>
              </div>
              <p>
                Biçim: Bench Press 4 x 10 40 kg · Excel sütunları: Egzersiz,
                Set, Tekrar, Kg
              </p>
              <textarea
                aria-label="İçe aktarılacak program"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={
                  "Bench Press 4 x 10 40 kg\nBiceps Curl 3 x 12 10 kg"
                }
              />
              <button
                type="button"
                disabled={!raw.trim()}
                onClick={() => {
                  const r = parseProgram(raw, s);
                  setWarnings(r.warnings);
                  if (r.items.length) setEdit({ ...edit, items: r.items });
                }}
              >
                Analiz et ve önizle
              </button>
              {warnings.length > 0 && (
                <p className="warning">
                  Eşleşmeyen satırlar (kaydedilmeyecek): {warnings.join(" · ")}
                </p>
              )}
            </div>
            <p className="eyebrow">KAYDETMEDEN ÖNCE KONTROL ET</p>
            {edit.items.map((item, i) => (
              <div className="plan-row" key={item.id}>
                <Field label="Egzersiz">
                  <select
                    value={item.exerciseId}
                    onChange={(e) => patch(i, { exerciseId: e.target.value })}
                  >
                    {s.exercises.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {(["sets", "reps", "weight", "rest"] as const).map((key, j) => (
                  <Field
                    key={key}
                    label={["Set", "Tekrar", "Kg", "Dinlenme sn"][j]}
                  >
                    <input
                      type="number"
                      min={key === "sets" || key === "reps" ? 1 : 0}
                      max={
                        { sets: 20, reps: 100, weight: 1000, rest: 600 }[key]
                      }
                      step={key === "weight" ? 0.5 : 1}
                      value={item[key]}
                      onChange={(e) => patch(i, { [key]: +e.target.value })}
                    />
                  </Field>
                ))}
                <button
                  type="button"
                  aria-label="Egzersizi kaldır"
                  onClick={() =>
                    setEdit({
                      ...edit,
                      items: edit.items.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setEdit({
                  ...edit,
                  items: [
                    ...edit.items,
                    {
                      id: uid(),
                      exerciseId: s.exercises[0].id,
                      sets: 3,
                      reps: 10,
                      weight: 0,
                      rest: 90,
                    },
                  ],
                })
              }
            >
              <Plus size={15} /> Egzersiz ekle
            </button>
            <Field label="Antrenman notları">
              <textarea
                value={edit.notes}
                onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
              />
            </Field>
            <footer>
              <button className="primary" disabled={!edit.items.length}>
                <Save size={16} /> Programı kaydet
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Active({ s, act, go, now }: PageProps) {
  const a = activeSession(s);
  const [draft, setDraft] = useState<
    Record<string, { weight: number; reps: number }>
  >({});
  if (!a)
    return (
      <Card>
        <Empty title="Bir sonraki antrenmanın seni bekliyor">
          <p>
            Program seçerek başla. Setlerin ve ilerlemen otomatik kaydedilir.
          </p>
          <button className="primary" onClick={() => go("programs")}>
            <Play size={16} /> Program seç
          </button>
        </Empty>
      </Card>
    );
  const done = a.sets.filter((x) => x.done).length;
  const secs = Math.floor(elapsed(a, now) / 1000),
    rest = Math.ceil(
      Math.max(
        0,
        a.pausedAt !== null ? a.restRemaining : (a.restUntil ?? now) - now,
      ) / 1000,
    );
  return (
    <>
      <div className="hero active-hero">
        <div>
          <span className="eyebrow">
            {a.pausedAt !== null ? "DURAKLATILDI" : "ANTRENMAN DEVAM EDİYOR"}
          </span>
          <h2>{a.name}</h2>
          <p>
            {done} / {a.sets.length} set tamamlandı · Yalnızca işaretlediğin
            setler sayılır.
          </p>
        </div>
        <div className="timer">
          {String(Math.floor(secs / 60)).padStart(2, "0")}:
          {String(secs % 60).padStart(2, "0")}
          <small>geçen süre</small>
        </div>
      </div>
      <div className="session-toolbar">
        <span>
          <Timer size={18} /> Dinlenme: <b>{rest} sn</b>
        </span>
        <span>
          Hacim: <b>{volume(a).toLocaleString("tr")} kg</b>
        </span>
        <button
          onClick={() =>
            void act({ type: a.pausedAt !== null ? "resume" : "pause" })
          }
        >
          {a.pausedAt !== null ? <Play size={16} /> : <Pause size={16} />}{" "}
          {a.pausedAt !== null ? "Devam et" : "Duraklat"}
        </button>
        <button
          className="primary"
          onClick={() => {
            if (
              confirm(
                `${done}/${a.sets.length} set tamamlandı. Antrenman bitirilsin mi? Kalan setler tamamlanmış sayılmayacak.`,
              )
            )
              void act({ type: "finish" });
          }}
        >
          Antrenmanı bitir
        </button>
      </div>
      <Progress value={(done / a.sets.length) * 100} />
      <div className="grid two space-top">
        {[...new Set(a.sets.map((x) => x.exerciseId))].map((ex) => {
          const prev = s.sessions
            .filter((x) => x.endedAt)
            .flatMap((x) => x.sets)
            .filter((x) => x.exerciseId === ex && x.done)
            .at(-1);
          return (
            <Card
              key={ex}
              title={s.exercises.find((x) => x.id === ex)?.name}
              action={
                <span className="tag">
                  {s.exercises.find((x) => x.id === ex)?.muscle}
                </span>
              }
            >
              <p>
                Önceki kayıt:{" "}
                {prev ? `${prev.weight} kg × ${prev.reps} tekrar` : "Henüz yok"}
              </p>
              <div className="set-row labels">
                <span>SET</span>
                <span>KG</span>
                <span>TEKRAR</span>
                <span>TAMAM</span>
              </div>
              {a.sets
                .filter((x) => x.exerciseId === ex)
                .map((st, i) => (
                  <div
                    className={`set-row ${st.done ? "done" : ""}`}
                    key={st.id}
                  >
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <input
                      aria-label={`${s.exercises.find((x) => x.id === ex)?.name} set ${i + 1} ağırlık`}
                      type="number"
                      min="0"
                      max="1000"
                      step="0.5"
                      disabled={st.done || a.pausedAt !== null}
                      value={draft[st.id]?.weight ?? st.weight}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [st.id]: {
                            reps: draft[st.id]?.reps ?? st.reps,
                            weight: +e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      aria-label={`Set ${i + 1} tekrar`}
                      type="number"
                      min="1"
                      max="100"
                      disabled={st.done || a.pausedAt !== null}
                      value={draft[st.id]?.reps ?? st.reps}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [st.id]: {
                            weight: draft[st.id]?.weight ?? st.weight,
                            reps: +e.target.value,
                          },
                        })
                      }
                    />
                    <button
                      aria-label={`Set ${i + 1} ${st.done ? "tamamlamayı geri al" : "tamamla"}`}
                      aria-pressed={st.done}
                      disabled={a.pausedAt !== null}
                      className={st.done ? "primary" : ""}
                      onClick={() =>
                        void act({
                          type: "set",
                          id: st.id,
                          done: !st.done,
                          weight: draft[st.id]?.weight ?? st.weight,
                          reps: draft[st.id]?.reps ?? st.reps,
                        })
                      }
                    >
                      <Check size={18} />
                    </button>
                  </div>
                ))}
            </Card>
          );
        })}
      </div>
      <Card title="Antrenman notu">
        <textarea
          key={a.id}
          defaultValue={a.notes}
          aria-label="Antrenman notu"
          onBlur={(e) => void act({ type: "notes", value: e.target.value })}
        />
        <p>Notlar alandan çıktığında kaydedilir.</p>
      </Card>
    </>
  );
}
export function Library({ s, search }: PageProps) {
  const [filter, setFilter] = useState("Tümü"),
    [q, setQ] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const ex = s.exercises.find((x) => x.id === selected);
  const list = s.exercises.filter(
    (x) =>
      (filter === "Tümü" || x.muscle === filter) &&
      `${x.name} ${x.muscle} ${x.equipment}`
        .toLocaleLowerCase("tr")
        .includes((q || search).toLocaleLowerCase("tr")),
  );
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Her hareketin bir amacı var.</h2>
          <p>
            {s.exercises.length} egzersiz · Kas grubu ve ekipmana göre keşfet.
          </p>
        </div>
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Egzersiz ara"
            placeholder="Egzersiz ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="tabs">
        {["Tümü", ...new Set(s.exercises.map((x) => x.muscle))].map((x) => (
          <button
            className={filter === x ? "selected" : ""}
            key={x}
            onClick={() => setFilter(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="grid three">
        {list.map((x, i) => (
          <button
            className="exercise-tile"
            key={x.id}
            onClick={() => setSelected(x.id)}
          >
            <div className="exercise-art">
              <span>{String(i + 1).padStart(2, "0")}</span>
              <Box size={52} strokeWidth={1} />
              <small>{x.equipment}</small>
            </div>
            <div>
              <span className="tag">{x.muscle}</span>
              <h3>{x.name}</h3>
              <p>Form notlarını incele ↗</p>
            </div>
          </button>
        ))}
      </div>
      {!list.length && <Empty title="Eşleşen egzersiz yok" />}
      {ex && (
        <Modal title={ex.name} onClose={() => setSelected(null)}>
          <span className="tag">
            {ex.muscle} · {ex.equipment}
          </span>
          <h3>Kontrol ve form</h3>
          <p>{ex.tips}</p>
          <div>
            {animationAssets[ex.id] && (
              <Suspense fallback={<p>3D görüntüleyici açılıyor…</p>}>
                <ExerciseViewer asset={animationAssets[ex.id]} />
              </Suspense>
            )}
          </div>
          <div className="notice" hidden={Boolean(animationAssets[ex.id])}>
            <Box size={24} />
            <div>
              <b>3D animasyon henüz mevcut değil</b>
              <p>
                Bu egzersiz için doğrulanmış, lisanslı hareket varlığı bu sürüme
                eklenmedi. Sabit bir model doğru form animasyonu olarak
                sunulmaz.
              </p>
            </div>
          </div>
          <p>
            Ağrı hissettiğinde hareketi durdur. Tekniği kişisel durumuna göre
            bir antrenörle değerlendir.
          </p>
        </Modal>
      )}
    </>
  );
}
