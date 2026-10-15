import { DatabaseSync } from "node:sqlite";
import { initialState, validateState, type State } from "../src/domain";
const collections = {
  exercises: "Exercises",
  programs: "WorkoutPrograms",
  sessions: "WorkoutSessions",
  nutrition: "NutritionEntries",
  foods: "Foods",
  measurements: "BodyMeasurements",
  goals: "Goals",
  reminders: "Notifications",
} as const;
export class Repository {
  db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS Migrations(version INTEGER PRIMARY KEY);",
    );
    this.db.exec("BEGIN");
    try {
      this.db.exec(
        "CREATE TABLE IF NOT EXISTS Settings(id TEXT PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS Users(id TEXT PRIMARY KEY,data TEXT NOT NULL);",
      );
      for (const table of Object.values(collections))
        this.db.exec(
          `CREATE TABLE IF NOT EXISTS ${table}(id TEXT PRIMARY KEY,data TEXT NOT NULL)`,
        );
      this.db.exec(
        "CREATE TABLE IF NOT EXISTS WorkoutDays(id TEXT PRIMARY KEY,programId TEXT NOT NULL REFERENCES WorkoutPrograms(id) ON DELETE CASCADE,day INTEGER NOT NULL CHECK(day BETWEEN 0 AND 6)); CREATE TABLE IF NOT EXISTS WorkoutSets(id TEXT PRIMARY KEY,sessionId TEXT NOT NULL REFERENCES WorkoutSessions(id) ON DELETE CASCADE,exerciseId TEXT NOT NULL REFERENCES Exercises(id),data TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_sets_session ON WorkoutSets(sessionId); CREATE TABLE IF NOT EXISTS PersonalRecords(exerciseId TEXT PRIMARY KEY REFERENCES Exercises(id),weight REAL NOT NULL); INSERT OR IGNORE INTO Migrations VALUES(1);",
      );
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    if (!this.db.prepare("SELECT id FROM Settings WHERE id=?").get("app"))
      this.save(initialState());
    if (
      !this.db.prepare("SELECT version FROM Migrations WHERE version=2").get()
    ) {
      this.db.exec("BEGIN IMMEDIATE");
      try {
        const insert = this.db.prepare(
          "INSERT OR IGNORE INTO Exercises(id,data) VALUES(?,?)",
        );
        for (const ex of initialState().exercises)
          insert.run(ex.id, JSON.stringify(ex));
        this.db.exec("INSERT INTO Migrations VALUES(2); COMMIT;");
      } catch (error) {
        this.db.exec("ROLLBACK");
        throw error;
      }
    }
  }
  load(): State {
    const s = initialState();
    for (const [key, table] of Object.entries(collections))
      (s as any)[key] = this.db
        .prepare(`SELECT data FROM ${table} ORDER BY rowid`)
        .all()
        .map((r) => JSON.parse(String(r.data)));
    const app = this.db
      .prepare("SELECT data FROM Settings WHERE id=?")
      .get("app");
    const profile = this.db
      .prepare("SELECT data FROM Users WHERE id=?")
      .get("local");
    const data = JSON.parse(String(app!.data));
    s.settings = data.settings;
    s.water = data.water;
    s.guest = data.guest ?? false;
    s.profile = profile ? JSON.parse(String(profile.data)) : null;
    // Also upgrade older JSON backups without replacing any user-owned exercise.
    for (const ex of initialState().exercises)
      if (!s.exercises.some((x) => x.id === ex.id)) s.exercises.push(ex);
    return validateState(s);
  }
  save(input: State) {
    const s = validateState(input);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.exec(
        "DELETE FROM WorkoutSets; DELETE FROM WorkoutDays; DELETE FROM PersonalRecords;",
      );
      for (const table of Object.values(collections))
        this.db.exec(`DELETE FROM ${table}`);
      for (const [key, table] of Object.entries(collections)) {
        const stmt = this.db.prepare(
          `INSERT INTO ${table}(id,data) VALUES(?,?)`,
        );
        for (const row of (s as any)[key])
          stmt.run(row.id, JSON.stringify(row));
      }
      const day = this.db.prepare("INSERT INTO WorkoutDays VALUES(?,?,?)");
      for (const p of s.programs) day.run(p.id, p.id, p.day);
      const set = this.db.prepare("INSERT INTO WorkoutSets VALUES(?,?,?,?)");
      const record = this.db.prepare(
        "INSERT INTO PersonalRecords VALUES(?,?) ON CONFLICT(exerciseId) DO UPDATE SET weight=MAX(weight,excluded.weight)",
      );
      for (const se of s.sessions)
        for (const st of se.sets) {
          set.run(st.id, se.id, st.exerciseId, JSON.stringify(st));
          if (st.done && se.endedAt) record.run(st.exerciseId, st.weight);
        }
      this.db
        .prepare("INSERT OR REPLACE INTO Settings VALUES(?,?)")
        .run(
          "app",
          JSON.stringify({
            settings: s.settings,
            water: s.water,
            guest: s.guest,
          }),
        );
      this.db.exec("DELETE FROM Users");
      if (s.profile)
        this.db
          .prepare("INSERT INTO Users VALUES(?,?)")
          .run("local", JSON.stringify(s.profile));
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  close() {
    this.db.close();
  }
}
