import { z } from "zod";
const text = z.string().trim().min(1).max(200),
  id = z.string().min(1).max(80),
  num = (max = 1000) => z.number().finite().min(0).max(max);
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
  );
export const exerciseSchema = z.object({
  id,
  name: text,
  muscle: text,
  equipment: text,
  tips: z.string().max(2000),
  animation: z.string().nullable().default(null),
});
export const setupSchema = z.object({
  completed: z.literal(true),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  location: z.enum(["gym", "home"]),
  equipment: z.enum(["gym", "dumbbells", "bodyweight"]),
  minutes: z.number().int().min(20).max(90),
  days: z
    .array(z.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .refine((x) => new Set(x).size === x.length, "Günler tekrarlanamaz."),
  hasRestrictions: z.boolean(),
  restrictions: z.string().max(1000),
  source: z.enum(["auto", "import", "existing"]),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
export const profileSchema = z.object({
  name: text,
  age: z.number().int().min(18).max(100),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(350),
  targetWeight: z.number().min(30).max(350),
  sex: z.enum(["male", "female"]),
  activity: z.number().min(1.2).max(1.9),
  frequency: z.number().int().min(1).max(7),
  goal: z.enum(["lose", "gain", "muscle", "maintain"]),
  preferences: z.string().max(500),
  allergies: z.string().max(500),
  calories: z.number().min(1000).max(6000),
  protein: num(400),
  carbs: num(1000),
  fat: num(300),
  setup: setupSchema.optional(),
});
export const planItemSchema = z.object({
  id,
  exerciseId: id,
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weight: num(),
  rest: z.number().int().min(0).max(600),
});
export const programSchema = z.object({
  id,
  name: text,
  day: z.number().int().min(0).max(6),
  notes: z.string().max(2000),
  items: z.array(planItemSchema).min(1).max(50),
});
export const setSchema = z.object({
  id,
  exerciseId: id,
  reps: z.number().int().min(1).max(100),
  weight: num(),
  done: z.boolean(),
  rest: z.number().int().min(0).max(600),
});
export const sessionSchema = z.object({
  id,
  name: text,
  programId: id,
  startedAt: z.number(),
  endedAt: z.number().nullable(),
  pausedAt: z.number().nullable(),
  pausedMs: num(1e12),
  restUntil: z.number().nullable(),
  restRemaining: num(600000),
  notes: z.string().max(2000),
  sets: z.array(setSchema).max(1000),
});
export const foodSchema = z.object({
  id,
  name: text,
  calories: num(5000),
  protein: num(),
  carbs: num(),
  fat: num(),
});
export const nutritionSchema = z.object({
  id,
  date,
  meal: text,
  name: text,
  calories: num(10000),
  protein: num(),
  carbs: num(),
  fat: num(),
});
export const measurementSchema = z.object({
  id,
  date,
  weight: z.number().min(30).max(350),
  height: z.number().min(100).max(250),
  waist: num(300),
  chest: num(300),
  arm: num(150),
  leg: num(200),
  hip: num(300),
  bodyFat: num(75),
});
export const goalSchema = z.object({
  id,
  name: text,
  target: z.number().positive().max(1e6),
  current: num(1e6),
  unit: text,
});
export const reminderSchema = z.object({
  id,
  title: text,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  enabled: z.boolean(),
  lastFired: z.string().max(30),
});
export const settingsSchema = z.object({
  theme: z.enum(["dark", "light"]),
  accent: z.enum(["lime", "blue", "purple"]),
  notifications: z.boolean(),
  startup: z.boolean(),
  tray: z.boolean(),
  compact: z.boolean(),
});
export const stateSchema = z.object({
  version: z.literal(1),
  guest: z.boolean().default(false),
  profile: profileSchema.nullable(),
  exercises: z.array(exerciseSchema).max(1000),
  programs: z.array(programSchema).max(1000),
  sessions: z.array(sessionSchema).max(10000),
  nutrition: z.array(nutritionSchema).max(100000),
  foods: z.array(foodSchema).max(10000),
  measurements: z.array(measurementSchema).max(10000),
  goals: z.array(goalSchema).max(1000),
  reminders: z.array(reminderSchema).max(1000),
  water: z.record(date, num(20000)),
  settings: settingsSchema,
});
export type State = z.infer<typeof stateSchema>;
export type Program = z.infer<typeof programSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Profile = z.infer<typeof profileSchema>;
export const days = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];
export const uid = () => crypto.randomUUID();
export function initialState(): State {
  return {
    version: 1,
    guest: false,
    profile: null,
    exercises: [
      [
        "bench",
        "Bench Press",
        "Göğüs",
        "Barbell",
        "Kürek kemiklerini sabitle. Ayaklarını yere bas. Ağırlığı kontrollü indir; ağır setlerde yardımcı kullan.",
      ],
      [
        "squat",
        "Squat",
        "Bacak",
        "Barbell",
        "Dizlerini ayaklarınla aynı yönde tut. Gövdeni kontrollü ve dengeli hareket ettir.",
      ],
      [
        "deadlift",
        "Deadlift",
        "Sırt",
        "Barbell",
        "Barı vücuduna yakın tut. Belini yuvarlama; hareketi kalçadan başlat.",
      ],
      [
        "shoulder",
        "Shoulder Press",
        "Omuz",
        "Dumbbell",
        "Belini aşırı germe. Ağırlığı kontrollü kaldır; ağrısız hareket aralığında çalış.",
      ],
      [
        "curl",
        "Biceps Curl",
        "Biceps",
        "Dumbbell",
        "Dirseklerini gövdene yakın tut; ağırlığı sallamadan kaldır.",
      ],
      [
        "lat",
        "Lat Pulldown",
        "Sırt",
        "Makine",
        "Barı enseye değil göğüs üstüne doğru çek; gövdeyi savurma.",
      ],
      [
        "row",
        "Dumbbell Row",
        "Sırt",
        "Dumbbell",
        "Omurgayı nötr tut; dirseği kalçana doğru çek.",
      ],
      [
        "triceps",
        "Triceps Pushdown",
        "Triceps",
        "Kablo",
        "Dirsekleri sabit tut; omuzlarla ağırlığı itme.",
      ],
      [
        "legpress",
        "Leg Press",
        "Bacak",
        "Makine",
        "Belini minderden kaldırma; dizlerini sert biçimde kilitleme.",
      ],
      [
        "lateral",
        "Lateral Raise",
        "Omuz",
        "Dumbbell",
        "Hafif ağırlıkla kontrollü kaldır; omuzlarını kulaklarına çekme.",
      ],
      [
        "incline",
        "Incline Dumbbell Press",
        "Göğüs",
        "Dumbbell",
        "Ayakları sabitle; omuzlarını öne yuvarlamadan kontrollü indir.",
      ],
      [
        "fly",
        "Cable Fly",
        "Göğüs",
        "Kablo",
        "Dirseklerini hafif bükülü tut; omuzu zorlayan derinliğe inme.",
      ],
      [
        "body_squat",
        "Bodyweight Squat",
        "Bacak",
        "Vücut ağırlığı",
        "Ayaklarını dengeli yerleştir; dizlerin ayakların yönünde ilerlesin. Ağrısız hareket aralığında çalış.",
      ],
      [
        "wall_push",
        "Wall Push-up",
        "Göğüs",
        "Vücut ağırlığı",
        "Ellerini duvara yerleştir, gövdeni düz tut ve kontrollü yaklaş. Kaymayan zeminde çalış.",
      ],
      [
        "bridge",
        "Glute Bridge",
        "Bacak",
        "Vücut ağırlığı",
        "Sırtüstü, dizler bükülü başla. Kalçanı kontrollü kaldır; belini aşırı germe.",
      ],
      [
        "bird_dog",
        "Bird Dog",
        "Karın",
        "Vücut ağırlığı",
        "Dört ayak pozisyonunda karşı kol ve bacağı kontrollü uzat; belini sabit tut. Tekrar sayısı her taraf içindir.",
      ],
      [
        "calf",
        "Standing Calf Raise",
        "Bacak",
        "Vücut ağırlığı",
        "Denge için sabit bir destek kullan. Topukları kontrollü kaldırıp indir.",
      ],
      [
        "prone_w",
        "Prone W Raise",
        "Sırt",
        "Vücut ağırlığı",
        "Yüzüstü, kollar W biçimindeyken elleri hafifçe kaldır. Boynu zorlamadan küçük hareket aralığında çalış.",
      ],
      [
        "goblet",
        "Goblet Squat",
        "Bacak",
        "Dumbbell",
        "Dambılı göğse yakın tut; dengeni koruyarak ağrısız aralıkta alçal.",
      ],
      [
        "db_rdl",
        "Dumbbell Romanian Deadlift",
        "Bacak",
        "Dumbbell",
        "Dizleri hafif bük, kalçadan eğil ve sırtını nötr tut. Önce hafif yükle tekniği öğren.",
      ],
      [
        "floor_press",
        "Dumbbell Floor Press",
        "Göğüs",
        "Dumbbell",
        "Yerde sırtüstü yat; dirsekleri kontrollü indir, zemine çarptırma.",
      ],
    ].map(([id, name, muscle, equipment, tips]) => ({
      id,
      name,
      muscle,
      equipment,
      tips,
      animation: null,
    })),
    programs: [],
    sessions: [],
    nutrition: [],
    foods: [
      {
        id: "oats",
        name: "Yulaf · 100 g (yaklaşık)",
        calories: 389,
        protein: 17,
        carbs: 66,
        fat: 7,
      },
      {
        id: "egg",
        name: "Yumurta · 1 adet (yaklaşık)",
        calories: 78,
        protein: 6,
        carbs: 1,
        fat: 5,
      },
    ],
    measurements: [],
    goals: [],
    reminders: [],
    water: {},
    settings: {
      theme: "dark",
      accent: "lime",
      notifications: true,
      startup: false,
      tray: true,
      compact: false,
    },
  };
}
export const activeSession = (s: State) =>
  s.sessions.find((x) => x.endedAt === null);
export const volume = (s: Session) =>
  s.sets.filter((x) => x.done).reduce((a, x) => a + x.reps * x.weight, 0);
export const elapsed = (s: Session, now = Date.now()) =>
  Math.max(0, (s.endedAt ?? s.pausedAt ?? now) - s.startedAt - s.pausedMs);
export function estimate(
  p: Pick<Profile, "weight" | "height" | "age" | "sex" | "activity" | "goal">,
) {
  const rest =
    10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161);
  return Math.round(
    rest * p.activity +
      { lose: -300, gain: 250, muscle: 150, maintain: 0 }[p.goal],
  );
}
export function validateState(input: unknown): State {
  const s = stateSchema.parse(input);
  const ex = new Set(s.exercises.map((x) => x.id));
  for (const list of [
    s.exercises,
    s.programs,
    s.sessions,
    s.nutrition,
    s.foods,
    s.measurements,
    s.goals,
    s.reminders,
  ])
    if (new Set(list.map((x) => x.id)).size !== list.length)
      throw Error("Tekrarlanan kayıt kimliği.");
  if (s.sessions.filter((x) => !x.endedAt).length > 1)
    throw Error("Birden fazla aktif antrenman olamaz.");
  for (const p of s.programs)
    for (const i of p.items)
      if (!ex.has(i.exerciseId)) throw Error("Bilinmeyen egzersiz.");
  for (const se of s.sessions) {
    if (new Set(se.sets.map((x) => x.id)).size !== se.sets.length)
      throw Error("Tekrarlanan set.");
    for (const set of se.sets)
      if (!ex.has(set.exerciseId)) throw Error("Bilinmeyen egzersiz.");
  }
  return s;
}
const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("guest") }),
  z.object({
    type: z.literal("onboard"),
    profile: profileSchema.extend({ setup: setupSchema }),
    programs: z.array(programSchema).max(14),
    replacePrograms: z.boolean(),
  }),
  z.object({ type: z.literal("profile"), value: profileSchema }),
  z.object({ type: z.literal("program"), value: programSchema }),
  z.object({ type: z.literal("start"), id }),
  z.object({
    type: z.literal("set"),
    id,
    done: z.boolean(),
    weight: num(),
    reps: z.number().int().min(1).max(100),
  }),
  z.object({ type: z.enum(["pause", "resume", "finish"]) }),
  z.object({ type: z.literal("notes"), value: z.string().max(2000) }),
  z.object({ type: z.literal("nutrition"), value: nutritionSchema }),
  z.object({ type: z.literal("food"), value: foodSchema }),
  z.object({ type: z.literal("measurement"), value: measurementSchema }),
  z.object({ type: z.literal("goal"), value: goalSchema }),
  z.object({ type: z.literal("reminder"), value: reminderSchema }),
  z.object({ type: z.literal("settings"), value: settingsSchema }),
  z.object({ type: z.literal("water"), date, value: num(20000) }),
  z.object({
    type: z.literal("delete"),
    collection: z.enum([
      "programs",
      "nutrition",
      "measurements",
      "goals",
      "reminders",
    ]),
    id,
  }),
]);
export function reduce(state: State, input: unknown, now = Date.now()): State {
  const a = actionSchema.parse(input);
  const s = structuredClone(state);
  const active = activeSession(s);
  const upsert = (list: { id: string }[], v: { id: string }) => {
    const i = list.findIndex((x) => x.id === v.id);
    if (i < 0) list.push(v);
    else list[i] = v;
  };
  switch (a.type) {
    case "guest":
      s.guest = true;
      break;
    case "onboard": {
      if (a.profile.setup.source === "auto" && a.profile.setup.hasRestrictions)
        throw Error(
          "Hareket kısıtlaması için uzman tarafından hazırlanmış programını ekle.",
        );
      if (a.profile.frequency !== a.profile.setup.days.length)
        throw Error("Antrenman günleri ile sıklık eşleşmiyor.");
      if (a.profile.setup.source === "existing" && !s.programs.length)
        throw Error("Korunacak mevcut program bulunamadı.");
      if (a.profile.setup.source !== "existing" && !a.programs.length)
        throw Error("En az bir antrenman günü ekle.");
      if (
        a.profile.setup.source === "existing" &&
        (a.replacePrograms || a.programs.length)
      )
        throw Error("Mevcut programı koruma seçimiyle program değiştirilemez.");
      s.profile = a.profile;
      s.guest = false;
      if (a.replacePrograms) s.programs = [];
      for (const p of a.programs) upsert(s.programs, p);
      if (!s.measurements.length)
        s.measurements.push({
          id: uid(),
          date: dateKey(new Date(now)),
          height: a.profile.height,
          weight: a.profile.weight,
          waist: 0,
          chest: 0,
          arm: 0,
          leg: 0,
          hip: 0,
          bodyFat: 0,
        });
      s.reminders = s.reminders.filter((r) => r.id !== "setup-reminder");
      if (a.profile.setup.reminderEnabled)
        s.reminders.push({
          id: "setup-reminder",
          title: `${a.profile.name}, antrenman zamanın geldi!`,
          time: a.profile.setup.reminderTime,
          days: a.profile.setup.days,
          enabled: true,
          lastFired: "",
        });
      break;
    }
    case "profile":
      s.profile = a.value;
      break;
    case "settings":
      s.settings = a.value;
      break;
    case "program":
      upsert(s.programs, a.value);
      break;
    case "nutrition":
      upsert(s.nutrition, a.value);
      break;
    case "food":
      upsert(s.foods, a.value);
      break;
    case "measurement":
      upsert(s.measurements, a.value);
      break;
    case "goal":
      upsert(s.goals, a.value);
      break;
    case "reminder":
      upsert(s.reminders, a.value);
      break;
    case "water":
      s.water[a.date] = a.value;
      break;
    case "delete":
      s[a.collection] = s[a.collection].filter((x) => x.id !== a.id) as never;
      break;
    case "start": {
      if (active) throw Error("Önce aktif antrenmanı bitir.");
      const p = s.programs.find((x) => x.id === a.id);
      if (!p) throw Error("Program bulunamadı.");
      s.sessions.push({
        id: uid(),
        name: p.name,
        programId: p.id,
        startedAt: now,
        endedAt: null,
        pausedAt: null,
        pausedMs: 0,
        restUntil: null,
        restRemaining: 0,
        notes: p.notes,
        sets: p.items.flatMap((i) =>
          Array.from({ length: i.sets }, () => ({
            id: uid(),
            exerciseId: i.exerciseId,
            reps: i.reps,
            weight: i.weight,
            done: false,
            rest: i.rest,
          })),
        ),
      });
      break;
    }
    case "set": {
      if (!active || active.pausedAt !== null)
        throw Error("Antrenmanı devam ettir.");
      const set = active.sets.find((x) => x.id === a.id);
      if (!set) throw Error("Set bulunamadı.");
      set.done = a.done;
      set.weight = a.weight;
      set.reps = a.reps;
      if (a.done) active.restUntil = now + set.rest * 1000;
      break;
    }
    case "pause":
      if (active && active.pausedAt === null) {
        active.pausedAt = now;
        active.restRemaining = Math.max(0, (active.restUntil ?? now) - now);
        active.restUntil = null;
      }
      break;
    case "resume":
      if (active && active.pausedAt !== null) {
        active.pausedMs += now - active.pausedAt;
        active.pausedAt = null;
        active.restUntil = active.restRemaining
          ? now + active.restRemaining
          : null;
        active.restRemaining = 0;
      }
      break;
    case "finish":
      if (!active) throw Error("Aktif antrenman bulunamadı.");
      if (active.pausedAt !== null) {
        active.pausedMs += now - active.pausedAt;
        active.pausedAt = null;
      }
      active.endedAt = now;
      active.restUntil = null;
      break;
    case "notes":
      if (active) active.notes = a.value;
      break;
  }
  return validateState(s);
}
export function parseProgram(
  raw: string,
  s: State,
): { items: Program["items"]; warnings: string[] } {
  const items: Program["items"] = [],
    warnings: string[] = [];
  for (const line of raw
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)) {
    const match = line.match(
      /^(.+?)\s*[,;—–-]?\s+(\d+)\s*[x×]\s*(\d+)(?:\s*[,;—–-]?\s*(\d+(?:[.,]\d+)?)\s*(?:kg)?)?\s*$/i,
    );
    if (!match) {
      warnings.push(line);
      continue;
    }
    const ex = s.exercises.find(
      (x) =>
        x.name.toLocaleLowerCase("tr") ===
        match[1]
          .replace(/[,;—–-]\s*$/, "")
          .trim()
          .toLocaleLowerCase("tr"),
    );
    if (!ex) {
      warnings.push(line);
      continue;
    }
    const result = planItemSchema.safeParse({
      id: uid(),
      exerciseId: ex.id,
      sets: +match[2],
      reps: +match[3],
      weight: Number((match[4] ?? "0").replace(",", ".")),
      rest: 90,
    });
    if (result.success) items.push(result.data);
    else warnings.push(line);
  }
  return { items, warnings };
}
