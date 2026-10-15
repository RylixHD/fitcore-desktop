import { useState } from "react";
import { Plus, Trash2, Droplets, Save } from "lucide-react";
import { type Profile, uid, dateKey, estimate } from "./domain";
import { Card, Empty, Field, Modal, Progress, Chart, formData } from "./ui";
import type { PageProps } from "./Workouts";
const number = (v: FormDataEntryValue | undefined) => Number(v ?? 0);
export function ProfileForm({
  initial,
  onSave,
}: {
  initial: Profile | null;
  onSave: (p: Profile) => Promise<boolean>;
}) {
  const [p, setP] = useState<Profile>(
    initial ?? {
      name: "",
      age: 25,
      height: 175,
      weight: 75,
      targetWeight: 75,
      sex: "male",
      activity: 1.375,
      frequency: 3,
      goal: "maintain",
      preferences: "",
      allergies: "",
      calories: 2400,
      protein: 120,
      carbs: 300,
      fat: 80,
    },
  );
  const patch = (v: Partial<Profile>) => setP({ ...p, ...v });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave(p);
      }}
    >
      <div className="grid two">
        <Field label="Adın">
          <input
            autoFocus
            required
            maxLength={100}
            value={p.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>
        <Field label="Fitness hedefin">
          <select
            value={p.goal}
            onChange={(e) => patch({ goal: e.target.value as Profile["goal"] })}
          >
            <option value="maintain">Kilo korumak</option>
            <option value="lose">Kilo vermek</option>
            <option value="gain">Kilo almak</option>
            <option value="muscle">Kas kütlesi artırmak</option>
          </select>
        </Field>
        {(
          ["age", "height", "weight", "targetWeight", "frequency"] as const
        ).map((key, i) => (
          <Field
            key={key}
            label={
              [
                "Yaş (18+)",
                "Boy (cm)",
                "Kilo (kg)",
                "Hedef kilo (kg)",
                "Haftalık antrenman",
              ][i]
            }
          >
            <input
              required
              type="number"
              step={key.includes("eight") ? 0.1 : 1}
              min={
                {
                  age: 18,
                  height: 100,
                  weight: 30,
                  targetWeight: 30,
                  frequency: 1,
                }[key]
              }
              max={
                {
                  age: 100,
                  height: 250,
                  weight: 350,
                  targetWeight: 350,
                  frequency: 7,
                }[key]
              }
              value={p[key]}
              onChange={(e) => patch({ [key]: +e.target.value })}
            />
          </Field>
        ))}
        <Field label="Denklem için biyolojik cinsiyet">
          <select
            value={p.sex}
            onChange={(e) => patch({ sex: e.target.value as Profile["sex"] })}
          >
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
          </select>
        </Field>
        <Field label="Günlük aktivite">
          <select
            value={p.activity}
            onChange={(e) => patch({ activity: +e.target.value })}
          >
            <option value="1.2">Hareketsiz</option>
            <option value="1.375">Hafif aktif</option>
            <option value="1.55">Orta aktif</option>
            <option value="1.725">Çok aktif</option>
            <option value="1.9">Yoğun aktif</option>
          </select>
        </Field>
        <Field label="Beslenme tercihlerin">
          <input
            value={p.preferences}
            onChange={(e) => patch({ preferences: e.target.value })}
          />
        </Field>
        <Field label="Alerjiler / kısıtlamalar">
          <input
            value={p.allergies}
            onChange={(e) => patch({ allergies: e.target.value })}
          />
        </Field>
      </div>
      <div className="notice">
        <div>
          <b>Tahmini enerji ihtiyacı: {estimate(p)} kcal / gün</b>
          <p>
            Mifflin–St Jeor denklemi × aktivite katsayısı; hedefe göre −300 /
            +250 / +150 kcal ayarı. Bu bir tahmindir, tıbbi beslenme önerisi
            değildir. Makro hedeflerini kendin düzenleyebilirsin.
          </p>
          <button
            type="button"
            onClick={() =>
              patch({ calories: Math.min(6000, Math.max(1000, estimate(p))) })
            }
          >
            Tahmini kalori hedefi olarak kullan
          </button>
        </div>
      </div>
      <div className="grid four">
        {(["calories", "protein", "carbs", "fat"] as const).map((key, i) => (
          <Field
            key={key}
            label={
              ["Kalori hedefi", "Protein (g)", "Karbonhidrat (g)", "Yağ (g)"][i]
            }
          >
            <input
              required
              type="number"
              min={key === "calories" ? 1000 : 0}
              max={{ calories: 6000, protein: 400, carbs: 1000, fat: 300 }[key]}
              value={p[key]}
              onChange={(e) => patch({ [key]: +e.target.value })}
            />
          </Field>
        ))}
      </div>
      <footer>
        <button className="primary">
          <Save size={16} /> Profili kaydet
        </button>
      </footer>
    </form>
  );
}
export function Nutrition({ s, act }: PageProps) {
  const [day, setDay] = useState(dateKey()),
    [show, setShow] = useState(false),
    [selected, setSelected] = useState(""),
    [amount, setAmount] = useState(1);
  const food = s.foods.find((x) => x.id === selected),
    list = s.nutrition.filter((x) => x.date === day),
    p = s.profile ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      preferences: "",
      allergies: "",
    };
  const total = (key: "calories" | "protein" | "carbs" | "fat") =>
    list.reduce((a, x) => a + x[key], 0);
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>İyi beslen. Güçlü hisset.</h2>
          <p>Tüketimini kaydet, günlük hedeflerini takip et.</p>
        </div>
        <div className="actions">
          <input
            aria-label="Beslenme tarihi"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <button className="primary" onClick={() => setShow(true)}>
            <Plus size={17} /> Besin ekle
          </button>
        </div>
      </div>
      <div className="grid four">
        {(["calories", "protein", "carbs", "fat"] as const).map((k, i) => (
          <Card key={k}>
            <p>{["Kalori", "Protein", "Karbonhidrat", "Yağ"][i]}</p>
            <div className="metric">
              {Math.round(total(k))}
              <small>
                {" "}
                {p[k]
                  ? `/ ${p[k]} ${i ? "g" : "kcal"}`
                  : `${i ? "g" : "kcal"} · Hedef yok`}
              </small>
            </div>
            <Progress value={p[k] ? (total(k) / p[k]) * 100 : 0} />
          </Card>
        ))}
      </div>
      <div className="grid main-split">
        <Card title="Öğün günlüğü" action={<span className="tag">{day}</span>}>
          {list.length ? (
            ["Kahvaltı", "Öğle", "Akşam", "Ara öğün"].map((meal) => (
              <div key={meal}>
                <h4>{meal}</h4>
                {list
                  .filter((x) => x.meal === meal)
                  .map((x) => (
                    <div className="list-row" key={x.id}>
                      <div>
                        <b>{x.name}</b>
                        <small>
                          {x.protein} g protein · {x.carbs} g karb · {x.fat} g
                          yağ
                        </small>
                      </div>
                      <b>
                        {x.calories} <small>kcal</small>
                      </b>
                      <button
                        aria-label={`${x.name} kaydını sil`}
                        onClick={() =>
                          void act({
                            type: "delete",
                            collection: "nutrition",
                            id: x.id,
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
              </div>
            ))
          ) : (
            <Empty title="Bugün tabağında neler var?">
              <p>İlk öğününü kaydetmek için besin ekle.</p>
            </Empty>
          )}
        </Card>
        <div>
          <Card title="Su dengesi" action={<Droplets size={20} />}>
            <div className="water-glass">
              <Droplets size={48} />
            </div>
            <div className="metric center">
              {((s.water[day] ?? 0) / 1000).toFixed(2)} <small>litre</small>
            </div>
            <p className="center">Kaydettiğin su tüketimi</p>
            <div className="actions center">
              <button
                disabled={(s.water[day] ?? 0) < 250}
                onClick={() =>
                  void act({
                    type: "water",
                    date: day,
                    value: Math.max(0, (s.water[day] ?? 0) - 250),
                  })
                }
              >
                −250 ml
              </button>
              <button
                className="primary"
                onClick={() =>
                  void act({
                    type: "water",
                    date: day,
                    value: (s.water[day] ?? 0) + 250,
                  })
                }
              >
                +250 ml
              </button>
            </div>
          </Card>
          <Card title="Kişisel tercihler">
            <p>{p.preferences || "Tercih belirtilmedi."}</p>
            <p>Alerji / kısıtlama: {p.allergies || "Belirtilmedi."}</p>
            <small>
              Besin değerlerini ambalajdan doğrula. Kayıtlar kişisel takip
              içindir.
            </small>
          </Card>
        </div>
      </div>
      <Card title="Son 7 gün · Kalori tüketimi">
        <Chart
          unit="kcal"
          data={Array.from({ length: 7 }, (_, i) => {
            const d = new Date(day + "T12:00:00");
            d.setDate(d.getDate() - 6 + i);
            return {
              name: d.toLocaleDateString("tr", { weekday: "short" }),
              value: s.nutrition
                .filter((x) => x.date === dateKey(d))
                .reduce((a, x) => a + x.calories, 0),
            };
          })}
        />
      </Card>
      {show && (
        <Modal title="Öğün kaydı" onClose={() => setShow(false)}>
          <form
            onSubmit={async (e) => {
              const f = formData(e);
              const value = {
                id: uid(),
                date: day,
                meal: String(f.meal),
                name: String(f.name),
                calories: number(f.calories),
                protein: number(f.protein),
                carbs: number(f.carbs),
                fat: number(f.fat),
              };
              if (await act({ type: "nutrition", value })) {
                if (f.favorite)
                  await act({
                    type: "food",
                    value: {
                      id: uid(),
                      name: value.name,
                      calories: value.calories,
                      protein: value.protein,
                      carbs: value.carbs,
                      fat: value.fat,
                    },
                  });
                setShow(false);
              }
            }}
          >
            <div className="grid two">
              <Field label="Kayıtlı besin (isteğe bağlı)">
                <select
                  autoFocus
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">Yeni besin</option>
                  {s.foods.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Porsiyon çarpanı">
                <input
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(+e.target.value)}
                />
              </Field>
            </div>
            <div key={`${selected}-${amount}`}>
              <Field label="Besin / öğün adı">
                <input
                  required
                  name="name"
                  defaultValue={food ? `${food.name} × ${amount}` : ""}
                />
              </Field>
              <Field label="Öğün">
                <select name="meal">
                  {["Kahvaltı", "Öğle", "Akşam", "Ara öğün"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <div className="grid four">
                {(["calories", "protein", "carbs", "fat"] as const).map(
                  (k, i) => (
                    <Field
                      key={k}
                      label={["Kalori", "Protein g", "Karb g", "Yağ g"][i]}
                    >
                      <input
                        required
                        name={k}
                        type="number"
                        min="0"
                        max={i ? 1000 : 10000}
                        step="0.1"
                        defaultValue={
                          Math.round((food?.[k] ?? 0) * amount * 10) / 10
                        }
                      />
                    </Field>
                  ),
                )}
              </div>
            </div>
            <label className="check">
              <input name="favorite" type="checkbox" /> Bu porsiyonu kayıtlı
              besinlere ekle
            </label>
            <footer>
              <button className="primary">Öğünü kaydet</button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Body({ s, act }: PageProps) {
  const [show, setShow] = useState(false),
    [metric, setMetric] = useState("weight");
  const list = [...s.measurements].sort((a, b) => a.date.localeCompare(b.date)),
    last = list.at(-1),
    weight = last?.weight ?? s.profile?.weight ?? 0,
    height = last?.height ?? s.profile?.height ?? 0;
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Değişim, küçük adımlarda.</h2>
          <p>Ölçümlerini aynı koşullarda kaydederek gelişimini karşılaştır.</p>
        </div>
        <button className="primary" onClick={() => setShow(true)}>
          <Plus size={17} /> Ölçüm ekle
        </button>
      </div>
      <div className="grid three">
        <Card>
          <p>Güncel kilo</p>
          <div className="metric">
            {weight || "—"}
            <small> kg</small>
          </div>
          <small>{last?.date ?? "Profil bilgisi"}</small>
        </Card>
        <Card>
          <p>Hedef kiloya fark</p>
          <div className="metric">
            {s.profile?.targetWeight && weight
              ? Math.abs(weight - s.profile.targetWeight).toFixed(1)
              : "—"}
            <small> kg</small>
          </div>
          <small>
            {s.profile?.targetWeight
              ? `Hedef: ${s.profile.targetWeight} kg`
              : "Kişisel hedef belirlenmedi"}
          </small>
        </Card>
        <Card>
          <p>Vücut kitle indeksi</p>
          <div className="metric">
            {weight && height ? (weight / (height / 100) ** 2).toFixed(1) : "—"}
          </div>
          <small>
            BMI tek başına sağlık veya vücut kompozisyonu değerlendirmesi
            değildir.
          </small>
        </Card>
      </div>
      <Card
        title="Ölçüm trendi"
        action={
          <select
            aria-label="Grafik ölçümü"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            {Object.entries({
              weight: "Kilo",
              waist: "Bel",
              chest: "Göğüs",
              arm: "Kol",
              leg: "Bacak",
              hip: "Kalça",
              bodyFat: "Yağ oranı",
            }).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        }
      >
        <Chart
          data={list
            .filter((x) => Number((x as any)[metric]) > 0)
            .map((x) => ({ name: x.date.slice(5), value: (x as any)[metric] }))}
          unit={metric === "weight" ? "kg" : metric === "bodyFat" ? "%" : "cm"}
        />
      </Card>
      <Card title="Ölçüm geçmişi">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Tarih",
                  "Kilo",
                  "Boy",
                  "Bel",
                  "Göğüs",
                  "Kol",
                  "Bacak",
                  "Kalça",
                  "Yağ %",
                  "",
                ].map((x, i) => (
                  <th key={i}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...list].reverse().map((x) => (
                <tr key={x.id}>
                  <td>{x.date}</td>
                  {(
                    [
                      "weight",
                      "height",
                      "waist",
                      "chest",
                      "arm",
                      "leg",
                      "hip",
                      "bodyFat",
                    ] as const
                  ).map((k) => (
                    <td key={k}>{x[k] || "—"}</td>
                  ))}
                  <td>
                    <button
                      aria-label="Ölçümü sil"
                      onClick={() => {
                        if (confirm("Bu ölçüm silinsin mi?"))
                          void act({
                            type: "delete",
                            collection: "measurements",
                            id: x.id,
                          });
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && <Empty title="Henüz ölçüm yok" />}
      </Card>
      {show && (
        <Modal title="Vücut ölçümü" onClose={() => setShow(false)}>
          <form
            onSubmit={async (e) => {
              const f = formData(e);
              if (
                await act({
                  type: "measurement",
                  value: {
                    ...Object.fromEntries(
                      [
                        "weight",
                        "height",
                        "waist",
                        "chest",
                        "arm",
                        "leg",
                        "hip",
                        "bodyFat",
                      ].map((k) => [k, number(f[k])]),
                    ),
                    id: uid(),
                    date: f.date,
                  },
                })
              )
                setShow(false);
            }}
          >
            <Field label="Ölçüm tarihi">
              <input
                autoFocus
                required
                name="date"
                type="date"
                defaultValue={dateKey()}
              />
            </Field>
            <div className="grid three">
              {(
                [
                  "weight",
                  "height",
                  "waist",
                  "chest",
                  "arm",
                  "leg",
                  "hip",
                  "bodyFat",
                ] as const
              ).map((k, i) => (
                <Field
                  key={k}
                  label={
                    [
                      "Kilo kg",
                      "Boy cm",
                      "Bel cm",
                      "Göğüs cm",
                      "Kol cm",
                      "Bacak cm",
                      "Kalça cm",
                      "Ölçülen yağ %",
                    ][i]
                  }
                >
                  <input
                    required={i < 2}
                    name={k}
                    type="number"
                    step="0.1"
                    min={i === 0 ? 30 : i === 1 ? 100 : 0}
                    max={
                      k === "weight"
                        ? 350
                        : k === "height"
                          ? 250
                          : k === "bodyFat"
                            ? 75
                            : k === "arm"
                              ? 150
                              : k === "leg"
                                ? 200
                                : 300
                    }
                    defaultValue={
                      i === 0
                        ? weight || undefined
                        : i === 1
                          ? height || undefined
                          : undefined
                    }
                  />
                </Field>
              ))}
            </div>
            <p>
              Bilmediğin çevre ve yağ oranı alanlarını boş bırak. Yağ oranı
              uygulama tarafından hesaplanmaz.
            </p>
            <footer>
              <button className="primary">Ölçümü kaydet</button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
