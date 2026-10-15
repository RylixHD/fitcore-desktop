import { useEffect, useRef, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  Dumbbell,
  Play,
  Library,
  Utensils,
  ScanLine,
  ChartNoAxesCombined,
  Target,
  CalendarDays,
  Settings as SettingsIcon,
  Search,
  Bell,
  ArrowUpRight,
  Flame,
  Zap,
  Weight,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { type State, activeSession, dateKey, volume } from "./domain";
import { Card, Chart, Stat, Progress } from "./ui";
import {
  Programs,
  Active,
  Library as ExerciseLibrary,
  type PageProps,
} from "./Workouts";
import { Nutrition, Body } from "./Health";
import Onboarding from "./Onboarding";
import { Goals, Calendar, Stats, Settings } from "./Planning";
const pages = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["programs", "Antrenman Programım", Dumbbell],
  ["active", "Aktif Antrenman", Play],
  ["library", "Egzersiz Kütüphanesi", Library],
  ["nutrition", "Beslenme Takibi", Utensils],
  ["body", "Vücut Analizi", ScanLine],
  ["stats", "Gelişim İstatistikleri", ChartNoAxesCombined],
  ["goals", "Hedeflerim", Target],
  ["calendar", "Takvim ve Hatırlatıcılar", CalendarDays],
  ["settings", "Ayarlar", SettingsIcon],
] as const;
export default function App() {
  const [s, setS] = useState<State | null>(null),
    [page, setPage] = useState("dashboard"),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [now, setNow] = useState(Date.now()),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    window.fitcore
      .load()
      .then(setS)
      .catch((e) => setError(String(e)));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["k", "1", "2"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "k") searchRef.current?.focus();
        else setPage(e.key === "1" ? "dashboard" : "active");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const act = (a: unknown): Promise<boolean> =>
    new Promise((resolve) => {
      queue.current = queue.current.then(async () => {
        setBusy(true);
        try {
          setS(await window.fitcore.action(a));
          resolve(true);
        } catch (e) {
          setError(
            String(e).replace(
              /^Error: Error invoking remote method '[^']+': Error: /,
              "",
            ),
          );
          resolve(false);
        } finally {
          setBusy(false);
        }
      });
    });
  const file = async (op: string) => {
    try {
      const result = await window.fitcore.file(op);
      if (result && op !== "import") {
        setToast(result);
        if (op === "restore" || op === "reset")
          setS(await window.fitcore.load());
      }
      return result;
    } catch (e) {
      setError(String(e));
      return null;
    }
  };
  if (!s)
    return (
      <main className="loading">
        <Activity size={44} />
        <h1>FITCORE</h1>
        <p>{error || "Yerel verilerin açılıyor…"}</p>
        {error && (
          <button onClick={() => location.reload()}>Yeniden dene</button>
        )}
      </main>
    );
  const props: PageProps = { s, act, file, go: setPage, now, search };
  const active = activeSession(s);
  return (
    <div className={`app ${s.settings.theme} accent-${s.settings.accent}`}>
      <aside className="sidebar">
        <a
          className="brand"
          onClick={() => setPage("dashboard")}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") setPage("dashboard");
          }}
        >
          <span>
            <Activity size={25} />
          </span>
          FITCORE<span className="brand-dot">®</span>
        </a>
        <div className="workspace-label">
          KİŞİSEL ALANIN <span>LOCAL</span>
        </div>
        <nav>
          {pages.map(([key, label, Icon], i) => (
            <button
              key={key}
              className={`${page === key ? "current" : ""} ${i === 9 ? "nav-settings" : ""}`}
              onClick={() => setPage(key)}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {key === "active" && active && <i className="live-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Zap size={19} />
          <b>Her gün biraz daha güçlü.</b>
          <p>Küçük adımlar, kalıcı değişim.</p>
        </div>
        <button className="user" onClick={() => setPage("settings")}>
          <span className="avatar">
            {s.profile?.name.slice(0, 1).toLocaleUpperCase("tr") || "F"}
          </span>
          <div>
            <b>{s.profile?.name || "Misafir"}</b>
            <small>Yerel profil</small>
          </div>
          <ChevronRight size={16} />
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Çalışma alanı /</span>{" "}
            {pages.find((x) => x[0] === page)?.[1]}
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Uygulamada egzersiz ara"
                placeholder="Egzersiz ara…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage("library");
                }}
              />
              <kbd>Ctrl K</kbd>
            </div>
            <span className="offline">
              <i /> Çevrimdışı hazır
            </span>
            <button
              aria-label="Hatırlatıcıları aç"
              onClick={() => setPage("calendar")}
            >
              <Bell size={18} />
            </button>
          </div>
        </header>
        <main key={page}>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                FITCORE /{" "}
                {page === "dashboard"
                  ? "GENEL BAKIŞ"
                  : pages
                      .find((x) => x[0] === page)?.[1]
                      .toLocaleUpperCase("tr")}
              </p>
              <h1>
                {page === "dashboard"
                  ? `İyi ki geldin${s.profile ? ", " + s.profile.name.split(" ")[0] : ""}.`
                  : pages.find((x) => x[0] === page)?.[1]}
              </h1>
            </div>
            <span className="date">
              <CalendarDays size={16} />
              {new Date(now).toLocaleDateString("tr", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {(s.profile || s.guest) &&
            (page === "dashboard" ? (
              <Dashboard {...props} />
            ) : page === "programs" ? (
              <Programs {...props} />
            ) : page === "active" ? (
              <Active {...props} />
            ) : page === "library" ? (
              <ExerciseLibrary {...props} />
            ) : page === "nutrition" ? (
              <Nutrition {...props} />
            ) : page === "body" ? (
              <Body {...props} />
            ) : page === "stats" ? (
              <Stats {...props} />
            ) : page === "goals" ? (
              <Goals {...props} />
            ) : page === "calendar" ? (
              <Calendar {...props} />
            ) : (
              <Settings {...props} />
            ))}
          <div className="statusbar">
            <span>
              <i className="live-dot" />{" "}
              {busy ? "Kaydediliyor…" : "Verilerin bu bilgisayarda saklanıyor"}
            </span>
            <span>FITCORE DESKTOP · 0.2.0</span>
          </div>
        </main>
      </div>
      {((!s.guest && !s.profile?.setup?.completed) || page === "setup") && (
        <Onboarding
          s={s}
          file={file}
          onCancel={
            s.profile?.setup || s.guest ? () => setPage("settings") : undefined
          }
          onSave={async (value) => {
            const ok = await act(value);
            if (ok) setPage("dashboard");
            return ok;
          }}
        />
      )}
      {error && (
        <div className="error-toast" role="alert">
          <b>İşlem tamamlanamadı</b>
          <p>{error}</p>
          <button onClick={() => setError("")}>Kapat</button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Dashboard({ s, act, go }: PageProps) {
  const p = s.profile ?? {
      frequency: 0,
      calories: 0,
      protein: 0,
      weight: 0,
      targetWeight: 0,
    },
    today = dateKey(),
    completed = s.sessions.filter((x) => x.endedAt),
    week = completed.filter((x) => x.startedAt > Date.now() - 7 * 86400000),
    food = s.nutrition.filter((x) => x.date === today),
    calories = food.reduce((a, x) => a + x.calories, 0),
    protein = food.reduce((a, x) => a + x.protein, 0),
    weight =
      [...s.measurements].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
        ?.weight ?? p.weight,
    plan = s.programs.find((x) => x.day === new Date().getDay()),
    active = activeSession(s),
    totalSets = completed.reduce(
      (a, x) => a + x.sets.filter((st) => st.done).length,
      0,
    );
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      name: d.toLocaleDateString("tr", { weekday: "short" }),
      value: completed
        .filter((x) => dateKey(new Date(x.startedAt)) === dateKey(d))
        .reduce((a, x) => a + volume(x), 0),
    };
  });
  const record = completed
    .flatMap((x) => x.sets)
    .filter((x) => x.done)
    .sort((a, b) => b.weight - a.weight)[0];
  let streak = 0;
  const dates = new Set(completed.map((x) => dateKey(new Date(x.startedAt))));
  const d = new Date();
  if (!dates.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (dates.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return (
    <>
      <div className="dashboard-intro">
        <p>Bugün kendin için güzel bir şey yap. İlerlemenin kontrolü sende.</p>
        <button onClick={() => go("stats")}>
          Gelişimi incele <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="hero">
        <div className="hero-content">
          <span className="pill">
            <i />{" "}
            {active
              ? "KALDIĞIN YERDEN DEVAM ET"
              : plan
                ? "BUGÜNÜN ANTRENMANI"
                : "YENİ BİR BAŞLANGIÇ"}
          </span>
          <h2>
            {active?.name ?? plan?.name ?? "Gücünün bir sonraki seviyesi."}
          </h2>
          <p>
            {active
              ? "Antrenmanın güvenle kaydedildi. Hazır olduğunda devam et."
              : plan
                ? `${plan.items.length} egzersiz · ${plan.items.reduce((a, x) => a + x.sets, 0)} set · Kendi temponda ilerle`
                : "Programını oluştur, ilk setini kaydet ve gelişimini gör."}
          </p>
          <button
            className="primary"
            onClick={async () => {
              if (active) go("active");
              else if (plan) {
                if (await act({ type: "start", id: plan.id })) go("active");
              } else go("programs");
            }}
          >
            <Play size={17} fill="currentColor" />
            {active
              ? "Antrenmana dön"
              : plan
                ? "Antrenmana başla"
                : "Programını oluştur"}
            <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="orb-core">
            <Dumbbell size={90} strokeWidth={1.2} />
          </div>
          <span className="visual-caption">
            BUILD YOUR
            <br />
            <b>STRONGER SELF.</b>
          </span>
        </div>
        <div className="hero-index">01 / YOUR JOURNEY</div>
      </div>
      <div className="grid four">
        <Stat
          label="Haftalık antrenman"
          value={week.length}
          unit={p.frequency ? `/ ${p.frequency}` : ""}
          detail="Son 7 gün · Bitirilen antrenman"
          icon={<Dumbbell size={19} />}
        />
        <Stat
          label="Günlük kalori"
          value={calories.toLocaleString("tr")}
          unit="kcal"
          detail={
            p.calories
              ? `${p.calories.toLocaleString("tr")} kcal günlük hedef`
              : "Kişisel hedef belirlenmedi"
          }
          icon={<Flame size={19} />}
        />
        <Stat
          label="Protein alımı"
          value={Math.round(protein)}
          unit="g"
          detail={
            p.protein
              ? `${p.protein} g günlük hedef`
              : "Kişisel hedef belirlenmedi"
          }
          icon={<Zap size={19} />}
        />
        <Stat
          label="Güncel kilo"
          value={weight || "—"}
          unit="kg"
          detail={
            p.targetWeight
              ? `${p.targetWeight} kg hedef · ${Math.abs(weight - p.targetWeight).toFixed(1)} kg fark`
              : "Kişisel hedef belirlenmedi"
          }
          icon={<Weight size={19} />}
        />
      </div>
      <div className="grid main-split">
        <Card
          title="Haftalık performans"
          action={<span className="tag">SON 7 GÜN</span>}
        >
          <div className="chart-heading">
            <div className="metric">
              {week.reduce((a, x) => a + volume(x), 0).toLocaleString("tr")}
              <small> kg</small>
            </div>
            <p>Toplam antrenman hacmi</p>
          </div>
          <Chart data={weekData} unit="kg" />
        </Card>
        <Card
          title="Günlük denge"
          action={
            <button
              className="icon-link"
              aria-label="Beslenmeye git"
              onClick={() => go("nutrition")}
            >
              <ArrowUpRight size={19} />
            </button>
          }
        >
          <div
            className="calorie-ring"
            style={
              {
                "--progress": `${p.calories ? Math.min(100, (calories / p.calories) * 100) : 0}%`,
              } as React.CSSProperties
            }
          >
            <div>
              <Flame size={22} />
              <strong>
                {p.calories ? Math.round((calories / p.calories) * 100) : "—"}
                <small>%</small>
              </strong>
              <span>kalori hedefi</span>
            </div>
          </div>
          <div className="macro-row">
            <span>Protein</span>
            <b>
              {Math.round(protein)} g{" "}
              {p.protein ? `/ ${p.protein} g` : "· Hedef yok"}
            </b>
          </div>
          <Progress value={p.protein ? (protein / p.protein) * 100 : 0} />
          <div className="macro-row">
            <span>Su tüketimi</span>
            <b>{((s.water[today] ?? 0) / 1000).toFixed(2)} L</b>
          </div>
          <button className="wide" onClick={() => go("nutrition")}>
            Öğününü kaydet <PlusIcon />
          </button>
        </Card>
      </div>
      {!s.settings.compact && (
        <div className="grid three">
          <Card title="Devamlılık serisi" action={<Flame size={19} />}>
            <div className="metric">
              {streak}
              <small> gün</small>
            </div>
            <p>
              {streak
                ? "Ritmini koruyorsun. Dinlenmeye de yer aç."
                : "İlk antrenmanını tamamlayarak başla."}
            </p>
          </Card>
          <Card title="En yüksek ağırlık" action={<Target size={19} />}>
            <div className="metric">
              {record?.weight ?? "—"}
              <small>{record ? " kg" : ""}</small>
            </div>
            <p>
              {record
                ? s.exercises.find((x) => x.id === record.exerciseId)?.name
                : "Rekorun ilk tamamlanan setinle başlayacak."}
            </p>
          </Card>
          <Card title="Toplam emeğin" action={<CheckCircle2 size={19} />}>
            <div className="metric">
              {totalSets}
              <small> set</small>
            </div>
            <p>{completed.length} bitirilen antrenman. Her kayıt bir adım.</p>
          </Card>
        </div>
      )}
    </>
  );
}
function PlusIcon() {
  return <span>＋</span>;
}
