import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  FileUp,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  type State,
  type Profile,
  type Program,
  profileSchema,
  programSchema,
  days,
  uid,
  parseProgram,
} from "./domain";
import {
  defaultSetup,
  estimatedTargets,
  suggestPrograms,
  type Setup,
} from "./personalization";
import { Field, Modal, Progress } from "./ui";
const steps = [
  "Seni tanıyalım",
  "Hedefin ve ölçümlerin",
  "Antrenman alışkanlığın",
  "Beslenme tercihlerin",
  "Programını seç",
  "Kontrol et ve başla",
];
const goalLabels = {
  lose: "Kilo vermek",
  gain: "Kilo almak",
  muscle: "Kas kütlesi artırmak",
  maintain: "Kilo korumak",
};
export default function Onboarding({
  s,
  onSave,
  file,
  onCancel,
}: {
  s: State;
  onSave: (value: unknown) => Promise<boolean>;
  file: (op: string) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [accepted, setAccepted] = useState(false);
  const [p, setP] = useState<Profile>(
    s.profile ?? {
      name: "",
      age: 0,
      height: 0,
      weight: 0,
      targetWeight: 0,
      sex: "male",
      activity: 1.375,
      frequency: 3,
      goal: "maintain",
      preferences: "",
      allergies: "",
      calories: 2000,
      protein: 100,
      carbs: 250,
      fat: 67,
    },
  );
  const [setup, setSetup] = useState<Setup>(
    s.profile?.setup
      ? { ...s.profile.setup, source: s.programs.length ? "existing" : "auto" }
      : { ...defaultSetup, source: s.programs.length ? "existing" : "auto" },
  );
  const [programs, setPrograms] = useState<Program[]>([]),
    [reasons, setReasons] = useState<string[]>([]),
    [generatedFor, setGeneratedFor] = useState(""),
    [raw, setRaw] = useState(""),
    [unmatched, setUnmatched] = useState<string[]>([]),
    [importDay, setImportDay] = useState(1),
    [importName, setImportName] = useState("Programım"),
    [replace, setReplace] = useState(false),
    [targetsEdited, setTargetsEdited] = useState(Boolean(s.profile));
  const signature = JSON.stringify({
    name: p.name,
    goal: p.goal,
    frequency: p.frequency,
    experience: setup.experience,
    equipment: setup.equipment,
    location: setup.location,
    minutes: setup.minutes,
    days: setup.days,
    hasRestrictions: setup.hasRestrictions,
  });
  const patch = (value: Partial<Profile>) => {
    setP((v) => ({ ...v, ...value }));
    setAccepted(false);
  };
  const updateSetup = (value: Partial<Setup>) => {
    setSetup((v) => ({ ...v, ...value }));
    setAccepted(false);
  };
  const usedPrograms = setup.source === "existing" ? s.programs : programs;
  const finalPrograms =
    setup.source !== "existing" && !replace
      ? [...s.programs, ...programs]
      : usedPrograms;
  const scheduledDays = [...new Set(finalPrograms.map((x) => x.day))].sort(
    (a, b) => ((a + 6) % 7) - ((b + 6) % 7),
  );
  const patchProgram = (id: string, value: Partial<Program>) => {
    setPrograms((ps) => ps.map((x) => (x.id === id ? { ...x, ...value } : x)));
    setAccepted(false);
  };
  const next = () => {
    setError("");
    try {
      if (
        step === 0 &&
        !profileSchema.pick({ name: true, age: true, sex: true }).safeParse(p)
          .success
      )
        throw Error("İsmini ve 18–100 arası yaşını gir.");
      if (
        step === 1 &&
        !profileSchema
          .pick({
            height: true,
            weight: true,
            targetWeight: true,
            activity: true,
            goal: true,
          })
          .safeParse(p).success
      )
        throw Error(
          "Boyunu (100–250 cm), kilonu ve hedef kilonu (30–350 kg) kontrol et.",
        );
      if (step === 2) {
        if (setup.days.length !== p.frequency)
          throw Error(
            `Haftada ${p.frequency} gün seçtin; takvimden tam ${p.frequency} gün işaretle.`,
          );
        if (setup.location === "home" && setup.equipment === "gym")
          throw Error("Evde kullanabildiğin ekipmanı seç.");
        if (!targetsEdited) setP((v) => ({ ...v, ...estimatedTargets(v) }));
      }
      if (step === 3 && !profileSchema.safeParse(p).success)
        throw Error("Kalori ve makro hedeflerini belirtilen aralıklarda gir.");
      if (step === 4) {
        if (!usedPrograms.length)
          throw Error("Bir program oluştur veya mevcut programını ekle.");
        if (setup.source === "auto" && generatedFor !== signature)
          throw Error(
            "Yanıtların değişti. Programı yeniden oluşturup kontrol et.",
          );
        if (setup.source === "auto" && setup.hasRestrictions)
          throw Error("Kısıtlamana uygun uzman programını ekle.");
        for (const program of usedPrograms)
          if (!programSchema.safeParse(program).success)
            throw Error(
              "Her programa isim ve en az bir geçerli egzersiz ekle.",
            );
      }
      setStep((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = async () => {
    if (!accepted || busy) return;
    setBusy(true);
    try {
      const finalSetup = { ...setup, days: scheduledDays, completed: true };
      const ok = await onSave({
        type: "onboard",
        profile: { ...p, frequency: scheduledDays.length, setup: finalSetup },
        programs: setup.source === "existing" ? [] : programs,
        replacePrograms: setup.source === "existing" ? false : replace,
      });
      if (!ok)
        setError(
          "Kurulum kaydedilemedi. Hata mesajını kontrol edip tekrar dene.",
        );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={
        s.profile?.setup
          ? "Kişisel kurulumunu güncelle"
          : "FITCORE’a hoş geldin"
      }
      onClose={onCancel}
    >
      <div className="setup-progress">
        <span>
          ADIM {step + 1} / {steps.length}
        </span>
        <b>{steps[step]}</b>
        <Progress value={((step + 1) / steps.length) * 100} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 5) void save();
          else next();
        }}
      >
        {step === 0 && (
          <div className="guest-entry">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onSave({ type: "guest" });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Hepsini atla · Misafir olarak devam et <ArrowRight size={17} />
            </button>
            <p>
              Kişisel bilgi vermeden kullan. Kayıtların bu bilgisayarda
              saklanır; kurulumu daha sonra tamamlayabilirsin.
            </p>
          </div>
        )}
        {step === 0 && (
          <div className="setup-step">
            <div className="setup-symbol">
              <UserRound size={32} />
            </div>
            <h2>Önce seni tanıyalım.</h2>
            <p>
              Sana isminle hitap edelim. Yanıtların bu bilgisayarda kalır;
              GitHub’a veya bir yapay zekâ servisine gönderilmez.
            </p>
            <Field label="İsmin">
              <input
                autoFocus
                required
                maxLength={100}
                autoComplete="given-name"
                placeholder="Sana nasıl hitap edelim?"
                value={p.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </Field>
            <div className="grid two">
              <Field label="Yaşın">
                <input
                  required
                  type="number"
                  min="18"
                  max="100"
                  placeholder="Örn. 25"
                  value={p.age || ""}
                  onChange={(e) => patch({ age: +e.target.value })}
                />
              </Field>
              <Field label="Enerji hesabı için biyolojik cinsiyet">
                <select
                  value={p.sex}
                  onChange={(e) =>
                    patch({ sex: e.target.value as Profile["sex"] })
                  }
                >
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                </select>
              </Field>
            </div>
            <small>
              Bu sürüm 18 yaş ve üzerindeki kullanıcılar içindir. Enerji
              hedefini daha sonra elle değiştirebilirsin.
            </small>
          </div>
        )}
        {step === 1 && (
          <div className="setup-step">
            <h2>{p.name.split(" ")[0]}, nereye ulaşmak istiyorsun?</h2>
            <Field label="Öncelikli hedefin">
              <select
                value={p.goal}
                onChange={(e) =>
                  patch({ goal: e.target.value as Profile["goal"] })
                }
              >
                {Object.entries(goalLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid three">
              {(["height", "weight", "targetWeight"] as const).map((key, i) => (
                <Field
                  key={key}
                  label={
                    ["Boyun (cm)", "Mevcut kilon (kg)", "Hedef kilon (kg)"][i]
                  }
                >
                  <input
                    autoFocus={i === 0}
                    required
                    type="number"
                    min={i ? 30 : 100}
                    max={i ? 350 : 250}
                    step="0.1"
                    value={p[key] || ""}
                    onChange={(e) => patch({ [key]: +e.target.value })}
                  />
                </Field>
              ))}
            </div>
            <Field label="Gün içinde ne kadar hareketlisin?">
              <select
                value={p.activity}
                onChange={(e) => patch({ activity: +e.target.value })}
              >
                <option value="1.2">Çoğunlukla oturuyorum</option>
                <option value="1.375">Hafif hareketliyim</option>
                <option value="1.55">Orta düzeyde hareketliyim</option>
                <option value="1.725">Çok hareketliyim</option>
                <option value="1.9">Yoğun fiziksel aktivitem var</option>
              </select>
            </Field>
            <p>
              Boy, kilo, yaş ve aktivite yanıtların enerji tahminini oluşturur.
              Başlangıç ağırlıkları vücut kilona göre otomatik atanmaz.
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="setup-step">
            <h2>Antrenman hayatına nasıl sığar?</h2>
            <div className="grid two">
              <Field label="Antrenman deneyimin">
                <select
                  autoFocus
                  value={setup.experience}
                  onChange={(e) =>
                    updateSetup({
                      experience: e.target.value as Setup["experience"],
                    })
                  }
                >
                  <option value="beginner">
                    Yeni başlıyorum / uzun ara verdim
                  </option>
                  <option value="intermediate">Düzenli çalışıyorum</option>
                  <option value="advanced">Deneyimliyim</option>
                </select>
              </Field>
              <Field label="Haftada kaç gün antrenman?">
                <select
                  value={p.frequency}
                  onChange={(e) => patch({ frequency: +e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      {n} gün
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Bir antrenmana ayırabileceğin süre">
                <select
                  value={setup.minutes}
                  onChange={(e) => updateSetup({ minutes: +e.target.value })}
                >
                  {[20, 35, 50, 65, 90].map((n) => (
                    <option key={n} value={n}>
                      {n} dakika
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nerede çalışacaksın?">
                <select
                  value={setup.location}
                  onChange={(e) =>
                    updateSetup({
                      location: e.target.value as Setup["location"],
                      equipment:
                        e.target.value === "gym" ? "gym" : "bodyweight",
                    })
                  }
                >
                  <option value="home">Evde</option>
                  <option value="gym">Spor salonunda</option>
                </select>
              </Field>
              <Field label="Kullanabildiğin ekipman">
                <select
                  value={setup.equipment}
                  onChange={(e) =>
                    updateSetup({
                      equipment: e.target.value as Setup["equipment"],
                    })
                  }
                >
                  <option value="bodyweight">
                    Ekipman yok · Vücut ağırlığı
                  </option>
                  <option value="dumbbells">Dambıl · Sehpa gerektirmez</option>
                  {setup.location === "gym" && (
                    <option value="gym">
                      Salon makineleri, kablo ve serbest ağırlık
                    </option>
                  )}
                </select>
              </Field>
            </div>
            <p>
              Hangi günler uygunsun?{" "}
              <b>
                {setup.days.length} / {p.frequency} gün seçili
              </b>
            </p>
            <div className="setup-days">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <label
                  key={d}
                  className={setup.days.includes(d) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={setup.days.includes(d)}
                    onChange={(e) =>
                      updateSetup({
                        days: e.target.checked
                          ? [...setup.days, d]
                          : setup.days.filter((x) => x !== d),
                      })
                    }
                  />
                  {days[d]}
                </label>
              ))}
            </div>
            <Field label="Hareketini etkileyen ağrı, yaralanma veya uzman kısıtlaması var mı?">
              <select
                value={setup.hasRestrictions ? "yes" : "no"}
                onChange={(e) =>
                  updateSetup({ hasRestrictions: e.target.value === "yes" })
                }
              >
                <option value="no">Hayır</option>
                <option value="yes">
                  Evet · Kendi uzman programımı ekleyeceğim
                </option>
              </select>
            </Field>
            {setup.hasRestrictions && (
              <Field label="Eklemek istediğin kısıtlama notu (isteğe bağlı)">
                <textarea
                  maxLength={1000}
                  value={setup.restrictions}
                  onChange={(e) =>
                    updateSetup({ restrictions: e.target.value })
                  }
                />
              </Field>
            )}
            <p>
              Otomatik öneri genel bir başlangıç taslağıdır; 1–4 kuvvet günü
              destekler. Daha sık çalışıyorsan veya hareket kısıtlaman varsa
              kendi programını ekleyebilirsin.
            </p>
          </div>
        )}
        {step === 3 && (
          <div className="setup-step">
            <h2>Beslenme hedeflerini birlikte belirleyelim.</h2>
            <div className="grid two">
              <Field label="Beslenme tercihin">
                <input
                  autoFocus
                  maxLength={500}
                  placeholder="Örn. vejetaryen, tercih yok…"
                  value={p.preferences}
                  onChange={(e) => patch({ preferences: e.target.value })}
                />
              </Field>
              <Field label="Alerji / besin kısıtlaması">
                <input
                  maxLength={500}
                  placeholder="Örn. süt alerjisi, yok…"
                  value={p.allergies}
                  onChange={(e) => patch({ allergies: e.target.value })}
                />
              </Field>
            </div>
            <div className="notice">
              <div>
                <b>
                  Yanıtlarına göre tahmini enerji:{" "}
                  {estimatedTargets(p).calories} kcal
                </b>
                <p>
                  Mifflin–St Jeor ve aktivite katsayısı kullanılır. Başlangıç
                  makro dağılımı %20 protein, %50 karbonhidrat, %30 yağdır;
                  aşağıdaki değerler kişisel tıbbi öneri değildir. Tercih ve
                  alerjilerin kaydedilir, otomatik menü üretilmez.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    patch(estimatedTargets(p));
                    setTargetsEdited(false);
                  }}
                >
                  Tahmini hedefleri uygula
                </button>
              </div>
            </div>
            <div className="grid four">
              {(["calories", "protein", "carbs", "fat"] as const).map(
                (key, i) => (
                  <Field
                    key={key}
                    label={
                      [
                        "Günlük kalori (kcal)",
                        "Protein (g)",
                        "Karbonhidrat (g)",
                        "Yağ (g)",
                      ][i]
                    }
                  >
                    <input
                      required
                      type="number"
                      min={i ? 0 : 1000}
                      max={
                        { calories: 6000, protein: 400, carbs: 1000, fat: 300 }[
                          key
                        ]
                      }
                      value={p[key]}
                      onChange={(e) => {
                        patch({ [key]: +e.target.value });
                        setTargetsEdited(true);
                      }}
                    />
                  </Field>
                ),
              )}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={setup.reminderEnabled}
                onChange={(e) =>
                  updateSetup({ reminderEnabled: e.target.checked })
                }
              />{" "}
              Antrenman günlerinde hatırlatma istiyorum
            </label>
            {setup.reminderEnabled && (
              <Field label="Hatırlatma saati">
                <input
                  required
                  type="time"
                  value={setup.reminderTime}
                  onChange={(e) =>
                    updateSetup({ reminderTime: e.target.value })
                  }
                />
              </Field>
            )}
          </div>
        )}
        {step === 4 && (
          <div className="setup-step">
            <h2>Hazır bir antrenman programın var mı?</h2>
            <div className="setup-choices">
              {[
                {
                  key: "auto",
                  title: "Benim için oluştur",
                  description: "Yanıtlarıma göre bir başlangıç taslağı",
                  icon: Sparkles,
                },
                {
                  key: "import",
                  title: "Programım var",
                  description: "Dosyadan aktar veya elle ekle",
                  icon: FileUp,
                },
                ...(s.programs.length
                  ? [
                      {
                        key: "existing",
                        title: "Kayıtlı programlarımı koru",
                        description: `${s.programs.length} mevcut program değişmeden kalır`,
                        icon: CheckCircle2,
                      },
                    ]
                  : []),
              ].map(({ key, title, description, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={setup.source === key}
                  className={setup.source === key ? "selected" : ""}
                  onClick={() => {
                    updateSetup({ source: key as Setup["source"] });
                    setPrograms([]);
                    setGeneratedFor("");
                    setReasons([]);
                    setError("");
                  }}
                >
                  <Icon size={23} />
                  <b>{title}</b>
                  <small>{description}</small>
                </button>
              ))}
            </div>
            {setup.source === "auto" && (
              <>
                <p>
                  Seçimlerin: {p.frequency} gün · {setup.minutes} dk ·{" "}
                  {setup.equipment === "bodyweight"
                    ? "Ekipmansız"
                    : setup.equipment === "gym"
                      ? "Salon"
                      : "Dambıl"}
                </p>
                <button
                  type="button"
                  className="primary"
                  disabled={setup.hasRestrictions || p.frequency > 4}
                  onClick={() => {
                    try {
                      const result = suggestPrograms(p, setup, s.exercises);
                      setPrograms(result.programs);
                      setReasons(result.reasons);
                      setGeneratedFor(signature);
                      setError("");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <Sparkles size={16} />
                  {programs.length
                    ? "Taslağı yeniden oluştur"
                    : "Kişisel programımı oluştur"}
                </button>
                {(setup.hasRestrictions || p.frequency > 4) && (
                  <p className="warning">
                    {setup.hasRestrictions
                      ? "Kısıtlamana uygun uzman programını “Programım var” ile ekle."
                      : "Otomatik taslak için önceki adımda 1–4 gün seç veya kendi programını ekle."}
                  </p>
                )}
                {reasons.length > 0 && (
                  <div className="notice">
                    <div>
                      <b>Bu program neden böyle?</b>
                      <ul>
                        {reasons.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
            {setup.source === "import" && (
              <div className="import-box">
                <div className="grid two">
                  <Field label="Eklenecek günün program adı">
                    <input
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                    />
                  </Field>
                  <Field label="Program günü">
                    <select
                      value={importDay}
                      onChange={(e) => setImportDay(+e.target.value)}
                    >
                      {days.map((d, i) => (
                        <option key={d} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const content = await file("import");
                      if (content) setRaw(content);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <FileUp size={16} /> PDF / Excel / metin dosyası seç
                </button>
                <Field label="Program metni">
                  <textarea
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    placeholder={
                      "Bench Press 4 x 10 40 kg\nBiceps Curl 3 x 12 10 kg"
                    }
                  />
                </Field>
                <p>
                  Her gün için ayrı program ekle. Dosya seçmek tek başına
                  kaydetmez; aşağıdan analiz edip önizlemeye ekle.
                </p>
                <div className="actions wrap">
                  <button
                    type="button"
                    disabled={!raw.trim()}
                    onClick={() => {
                      const result = parseProgram(raw, s);
                      setUnmatched(result.warnings);
                      if (result.items.length) {
                        setPrograms((ps) => [
                          ...ps,
                          {
                            id: uid(),
                            name: importName.trim() || "Programım",
                            day: importDay,
                            notes:
                              "Kullanıcı tarafından içe aktarıldı ve kontrol edildi.",
                            items: result.items,
                          },
                        ]);
                        setRaw("");
                        setError("");
                      } else
                        setError(
                          "Eşleşen egzersiz bulunamadı. Biçimi kontrol et veya elle ekle.",
                        );
                    }}
                  >
                    Analiz et ve güne ekle
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPrograms((ps) => [
                        ...ps,
                        {
                          id: uid(),
                          name: importName.trim() || "Programım",
                          day: importDay,
                          notes: "",
                          items: [
                            {
                              id: uid(),
                              exerciseId:
                                setup.equipment === "bodyweight"
                                  ? "body_squat"
                                  : setup.equipment === "dumbbells"
                                    ? "goblet"
                                    : "bench",
                              sets: 3,
                              reps: 10,
                              weight: 0,
                              rest: 90,
                            },
                          ],
                        },
                      ])
                    }
                  >
                    <Plus size={16} /> Elle gün ekle
                  </button>
                </div>
                {unmatched.length > 0 && (
                  <p className="warning">
                    Eklenmeyen satırlar: {unmatched.join(" · ")}
                  </p>
                )}
              </div>
            )}
            {setup.source === "existing" ? (
              <div className="notice">
                <div>
                  {s.programs.map((program) => (
                    <p key={program.id}>
                      <b>{days[program.day]}:</b> {program.name} ·{" "}
                      {program.items.length} hareket
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              programs.map((program) => (
                <section className="setup-program" key={program.id}>
                  <div className="grid two">
                    <Field label="Program adı">
                      <input
                        required
                        value={program.name}
                        onChange={(e) =>
                          patchProgram(program.id, { name: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Gün">
                      <select
                        value={program.day}
                        onChange={(e) =>
                          patchProgram(program.id, { day: +e.target.value })
                        }
                      >
                        {days.map((d, i) => (
                          <option key={d} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  {program.items.map((item) => (
                    <div className="plan-row" key={item.id}>
                      <Field label="Egzersiz">
                        <select
                          value={item.exerciseId}
                          onChange={(e) =>
                            patchProgram(program.id, {
                              items: program.items.map((x) =>
                                x.id === item.id
                                  ? { ...x, exerciseId: e.target.value }
                                  : x,
                              ),
                            })
                          }
                        >
                          {s.exercises.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {(["sets", "reps", "weight", "rest"] as const).map(
                        (k, i) => (
                          <Field
                            label={["Set", "Tekrar", "Kg", "Dinlenme sn"][i]}
                            key={k}
                          >
                            <input
                              required
                              type="number"
                              min={i < 2 ? 1 : 0}
                              max={
                                {
                                  sets: 20,
                                  reps: 100,
                                  weight: 1000,
                                  rest: 600,
                                }[k]
                              }
                              step={k === "weight" ? 0.5 : 1}
                              value={item[k]}
                              onChange={(e) =>
                                patchProgram(program.id, {
                                  items: program.items.map((x) =>
                                    x.id === item.id
                                      ? { ...x, [k]: +e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </Field>
                        ),
                      )}
                      <button
                        type="button"
                        aria-label="Egzersizi kaldır"
                        onClick={() =>
                          patchProgram(program.id, {
                            items: program.items.filter(
                              (x) => x.id !== item.id,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() =>
                        patchProgram(program.id, {
                          items: [
                            ...program.items,
                            {
                              id: uid(),
                              exerciseId:
                                program.items[0]?.exerciseId ??
                                s.exercises[0].id,
                              sets: 2,
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
                    <button
                      type="button"
                      onClick={() =>
                        setPrograms((ps) =>
                          ps.filter((x) => x.id !== program.id),
                        )
                      }
                    >
                      Bu günü kaldır
                    </button>
                  </div>
                </section>
              ))
            )}
            {setup.source !== "existing" && s.programs.length > 0 && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={replace}
                  onChange={(e) => setReplace(e.target.checked)}
                />{" "}
                Yeni programlar eski programların yerini alsın (antrenman
                geçmişi korunur)
              </label>
            )}
          </div>
        )}
        {step === 5 && (
          <div className="setup-step">
            <div className="setup-symbol">
              <Dumbbell size={32} />
            </div>
            <h2>{p.name.split(" ")[0]}, kişisel alanın hazır.</h2>
            <p>
              Kaydetmeden önce yanıtlarını ve programını kontrol et. Değişiklik
              için geri dönebilirsin.
            </p>
            <div className="grid two">
              <div className="setup-summary">
                <b>Senin profilin</b>
                <p>
                  {p.name} · {p.age} yaş
                  <br />
                  {p.height} cm · {p.weight} kg → {p.targetWeight} kg
                  <br />
                  {goalLabels[p.goal]}
                </p>
              </div>
              <div className="setup-summary">
                <b>Günlük hedeflerin</b>
                <p>
                  {p.calories} kcal
                  <br />
                  {p.protein} g protein · {p.carbs} g karbonhidrat · {p.fat} g
                  yağ
                  <br />
                  {p.preferences || "Beslenme tercihi belirtilmedi"} ·{" "}
                  {p.allergies || "Alerji bilgisi belirtilmedi"}
                </p>
              </div>
            </div>
            <div className="setup-summary">
              <b>
                {usedPrograms.length} program · {scheduledDays.length} farklı
                antrenman günü
              </b>
              <p>{scheduledDays.map((d) => days[d]).join(" · ")}</p>
              {usedPrograms.map((program) => (
                <p key={program.id}>
                  <b>{program.name}</b> · {program.items.length} hareket ·{" "}
                  {program.items.reduce((a, x) => a + x.sets, 0)} set
                </p>
              ))}
              {scheduledDays.length !== p.frequency && (
                <p className="warning">
                  İlk yanıtın {p.frequency} gündü. Son düzenlediğin program{" "}
                  {scheduledDays.length} güne ait; haftalık hedefin buna göre{" "}
                  {scheduledDays.length} gün olarak kaydedilecek.
                </p>
              )}
              <p>
                {setup.reminderEnabled
                  ? `Bu günlerde ${setup.reminderTime} hatırlatıcısı oluşturulacak.`
                  : "Hatırlatıcı oluşturulmayacak."}
              </p>
              {s.programs.length > 0 && setup.source !== "existing" && (
                <p>
                  {replace
                    ? "Önceki programlar yenileriyle değiştirilecek. Geçmiş kayıtlar korunacak."
                    : "Yeni programlar mevcut programlarının yanına eklenecek."}
                </p>
              )}
            </div>
            <label className="check setup-consent">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />{" "}
              Bilgilerimi ve programı kontrol ettim. Bu ayarlarla başlamak
              istiyorum.
            </label>
          </div>
        )}
        {error && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}
        <footer className="setup-footer">
          {step > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep((v) => v - 1);
                setError("");
                setAccepted(false);
              }}
            >
              <ArrowLeft size={16} /> Geri
            </button>
          ) : (
            <span />
          )}
          <small>Yanıtların yalnızca son onayda kaydedilir.</small>
          <button
            className="primary"
            type="submit"
            disabled={busy || (step === 5 && !accepted)}
          >
            {step === 5 ? (
              <>
                <Check size={16} />
                {busy ? "Kaydediliyor…" : "Kişisel alanımı oluştur"}
              </>
            ) : (
              <>
                Devam <ArrowRight size={16} />
              </>
            )}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
