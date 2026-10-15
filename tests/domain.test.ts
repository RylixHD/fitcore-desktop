import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  initialState,
  reduce,
  activeSession,
  elapsed,
  volume,
  parseProgram,
  validateState,
  estimate,
} from "../src/domain";
import { Repository } from "../electron/database";
const program = {
  id: "p",
  name: "Göğüs",
  day: 1,
  notes: "Kontrollü",
  items: [
    { id: "i", exerciseId: "bench", sets: 2, reps: 10, weight: 40, rest: 90 },
  ],
};
function start() {
  return reduce(
    reduce(initialState(), { type: "program", value: program }),
    { type: "start", id: "p" },
    1000,
  );
}
test("Sets never complete automatically, finish preserves incomplete sets", () => {
  let s = start();
  const a = activeSession(s)!;
  assert.equal(a.sets.filter((x) => x.done).length, 0);
  s = reduce(
    s,
    { type: "set", id: a.sets[0].id, weight: 45, reps: 8, done: true },
    2000,
  );
  assert.equal(volume(activeSession(s)!), 360);
  s = reduce(s, { type: "finish" }, 3000);
  assert.equal(s.sessions[0].sets[1].done, false);
  assert.equal(activeSession(s), undefined);
});
test("Pause excludes elapsed time and freezes rest timer", () => {
  let s = start();
  s = reduce(
    s,
    {
      type: "set",
      id: activeSession(s)!.sets[0].id,
      weight: 40,
      reps: 10,
      done: true,
    },
    2000,
  );
  s = reduce(s, { type: "pause" }, 12000);
  assert.equal(elapsed(activeSession(s)!, 50000), 11000);
  assert.equal(activeSession(s)!.restRemaining, 80000);
  assert.throws(() =>
    reduce(s, {
      type: "set",
      id: activeSession(s)!.sets[1].id,
      weight: 40,
      reps: 10,
      done: true,
    }),
  );
  s = reduce(s, { type: "resume" }, 22000);
  assert.equal(activeSession(s)!.restUntil, 102000);
  assert.equal(elapsed(activeSession(s)!, 25000), 14000);
});
test("Cannot start multiple sessions or accept invalid values", () => {
  const s = start();
  assert.throws(() => reduce(s, { type: "start", id: "p" }));
  assert.throws(() =>
    reduce(s, {
      type: "set",
      id: activeSession(s)!.sets[0].id,
      weight: -1,
      reps: 10,
      done: true,
    }),
  );
  assert.throws(() =>
    reduce(s, { type: "water", date: "2026-02-31", value: 250 }),
  );
  assert.throws(() => reduce(s, { type: "unknown" }));
});
test("Import parses known movements and reports unsupported lines", () => {
  const r = parseProgram(
    "Bench Press 4 x 10 40 kg\nBiceps Curl 3 × 12 12,5 kg\nUnknown 3 x 10\nPazartesi",
    initialState(),
  );
  assert.equal(r.items.length, 2);
  assert.equal(r.items[1].weight, 12.5);
  assert.equal(r.warnings.length, 2);
});
test("SQLite persists active sets, measurements and profile across reopen", () => {
  const dir = mkdtempSync(join(tmpdir(), "fitcore-test-"));
  const file = join(dir, "db.sqlite");
  let repo = new Repository(file);
  let s = start();
  s = reduce(
    s,
    {
      type: "set",
      id: activeSession(s)!.sets[0].id,
      weight: 42.5,
      reps: 10,
      done: true,
    },
    2000,
  );
  repo.save(s);
  repo.close();
  repo = new Repository(file);
  assert.deepEqual(repo.load(), s);
  assert.equal(
    repo.db.prepare("SELECT count(*) AS n FROM WorkoutSets").get()?.n,
    2,
  );
  assert.equal(
    repo.db.prepare("PRAGMA integrity_check").get()?.integrity_check,
    "ok",
  );
  repo.close();
  rmSync(dir, { recursive: true, force: true });
});
test("Invalid restore rejected before any database mutation", () => {
  const repo = new Repository(":memory:");
  repo.save(start());
  const before = repo.load();
  assert.throws(() =>
    repo.save({
      ...before,
      programs: [
        { ...program, items: [{ ...program.items[0], exerciseId: "missing" }] },
      ],
    }),
  );
  assert.deepEqual(repo.load(), before);
  assert.throws(() =>
    validateState({
      ...before,
      sessions: [...before.sessions, ...before.sessions],
    }),
  );
  repo.close();
});
test("Mifflin St Jeor calculation matches known arithmetic", () => {
  assert.equal(
    estimate({
      weight: 75,
      height: 175,
      age: 25,
      sex: "male",
      activity: 1.2,
      goal: "maintain",
    }),
    2069,
  );
});
test("Deleting template preserves historical workout and foreign keys", () => {
  const repo = new Repository(":memory:");
  const s = reduce(start(), {
    type: "delete",
    collection: "programs",
    id: "p",
  });
  repo.save(s);
  assert.equal(repo.load().programs.length, 0);
  assert.equal(repo.load().sessions.length, 1);
  assert.equal(repo.db.prepare("PRAGMA foreign_key_check").all().length, 0);
  repo.close();
});
