import {
  type Profile,
  type Program,
  type State,
  setupSchema,
  profileSchema,
  uid,
  days,
  estimate,
} from "./domain";
import type { z } from "zod";
export type Setup = z.infer<typeof setupSchema>;
export const defaultSetup: Setup = {
  completed: true,
  experience: "beginner",
  location: "home",
  equipment: "bodyweight",
  minutes: 35,
  days: [1, 3, 5],
  hasRestrictions: false,
  restrictions: "",
  source: "auto",
  reminderEnabled: false,
  reminderTime: "18:00",
};
export function estimatedTargets(p: Profile) {
  const calories = Math.max(1000, Math.min(6000, estimate(p)));
  return {
    calories,
    protein: Math.round((calories * 0.2) / 4),
    carbs: Math.round((calories * 0.5) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}
export function suggestPrograms(
  profile: Profile,
  setup: Setup,
  exercises: State["exercises"],
): { programs: Program[]; reasons: string[] } {
  profileSchema.parse(profile);
  setupSchema.parse(setup);
  if (setup.hasRestrictions)
    throw Error(
      "Hareketini etkileyen bir kısıtlama belirttin. Uzmanının hazırladığı programı ekleyebilirsin.",
    );
  if (setup.days.length !== profile.frequency)
    throw Error("Seçtiğin gün sayısı haftalık sıklıkla aynı olmalı.");
  if (setup.days.length > 4)
    throw Error(
      "Otomatik başlangıç programı 1–4 kuvvet günü destekler. Daha sık bir program için mevcut programını ekle.",
    );
  if (setup.location === "home" && setup.equipment === "gym")
    throw Error("Ev için sahip olduğun ekipmanı seç.");
  const pools = {
    gym: {
      full: ["legpress", "bench", "lat", "db_rdl", "bird_dog", "lateral"],
      upper: ["bench", "lat", "shoulder", "row", "curl", "triceps"],
      lower: ["legpress", "db_rdl", "bridge", "calf", "bird_dog"],
    },
    dumbbells: {
      full: ["goblet", "floor_press", "row", "db_rdl", "bird_dog", "lateral"],
      upper: ["floor_press", "row", "shoulder", "curl", "lateral", "prone_w"],
      lower: ["goblet", "db_rdl", "bridge", "calf", "bird_dog"],
    },
    bodyweight: {
      full: [
        "body_squat",
        "wall_push",
        "prone_w",
        "bridge",
        "bird_dog",
        "calf",
      ],
      upper: ["wall_push", "prone_w", "bird_dog"],
      lower: ["body_squat", "bridge", "calf", "bird_dog"],
    },
  }[setup.equipment];
  const count = setup.minutes <= 25 ? 4 : setup.minutes <= 45 ? 5 : 6;
  const sets = setup.experience === "beginner" || setup.minutes <= 25 ? 2 : 3;
  const reps = profile.goal === "muscle" || profile.goal === "gain" ? 10 : 12;
  const sorted = [...setup.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const split = sorted.length === 4;
  const reasons = [
    `${setup.equipment === "gym" ? "Salon" : setup.equipment === "dumbbells" ? "Yalnızca dambıl ve yer" : "Ekipmansız"} hareketleri seçildi.`,
    `${setup.experience === "beginner" ? "Başlangıç deneyimi" : setup.experience === "intermediate" ? "Orta seviye" : "Deneyimli seviye"} ve ${setup.minutes} dakikalık zamanına göre hareket başına ${sets} set kullanıldı.`,
    `${sorted.length} gün için ${split ? "üst / alt vücut dönüşümü" : "tüm vücut"} taslağı hazırlandı.`,
    `${profile.goal === "muscle" || profile.goal === "gain" ? "Kas / kilo alma" : "Genel kondisyon / kilo yönetimi"} hedefin için ${reps} tekrarlı başlangıç setleri kullanıldı. Yük otomatik atanmaz; 0 kg henüz yük seçilmedi demektir.`,
  ];
  if (
    !split &&
    sorted.some((d, i) =>
      sorted.some((other, j) => i !== j && (other - d + 7) % 7 === 1),
    )
  )
    reasons.push(
      "Ardışık kuvvet günleri seçtin. Günleri düzenleyerek araya dinlenme koyabilirsin.",
    );
  const programs = sorted.map((day, index) => {
    const ids = (
      split
        ? index % 2
          ? pools.lower
          : pools.upper
        : [
            ...pools.full.slice(0, 3),
            ...pools.full.slice(3).slice(index % 2),
            ...pools.full.slice(3).slice(0, index % 2),
          ]
    ).slice(0, count);
    for (const id of ids)
      if (!exercises.some((x) => x.id === id))
        throw Error(
          "Egzersiz kütüphanesi güncellenemedi. Uygulamayı yeniden başlat.",
        );
    return {
      id: uid(),
      day,
      name: `${profile.name.split(" ")[0]} · ${split ? (index % 2 ? "Alt vücut" : "Üst vücut") : "Tüm vücut"} · ${days[day]}`,
      notes: `Yanıtlarına göre oluşturulan başlangıç taslağı. ${setup.minutes} dakika zaman tercihi; gerçek süre tempona bağlıdır. Isınmaya ve dinlenmeye zaman ayır. Ağırlığı tekniğini koruyabileceğin düzeyde kendin seç. Ağrı varsa dur. ${setup.experience === "beginner" ? "Öncelik teknik ve alışkanlık kazanmak." : ""}`,
      items: ids.map((exerciseId) => ({
        id: uid(),
        exerciseId,
        sets,
        reps: exerciseId === "bird_dog" ? 8 : reps,
        weight: 0,
        rest: setup.experience === "beginner" ? 90 : 120,
      })),
    };
  });
  return { programs, reasons };
}
