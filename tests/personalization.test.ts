import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  reduce,
  type Profile,
  validateState,
} from "../src/domain";
import {
  defaultSetup,
  suggestPrograms,
  estimatedTargets,
  type Setup,
} from "../src/personalization";
import { Repository } from "../electron/database";
const profile: Profile = {
  name: "Test Sporcu",
  age: 28,
  height: 175,
  weight: 75,
  targetWeight: 72,
  sex: "male",
  activity: 1.375,
  frequency: 3,
  goal: "maintain",
  preferences: "",
  allergies: "",
  calories: 2300,
  protein: 115,
  carbs: 288,
  fat: 77,
};
test("Guest mode stores no fabricated profile, measurements or goals", () => {
  const s = reduce(initialState(), { type: "guest" });
  assert.equal(s.guest, true);
  assert.equal(s.profile, null);
  assert.equal(s.measurements.length, 0);
  assert.equal(s.programs.length, 0);
  const repo = new Repository(":memory:");
  repo.save(s);
  assert.deepEqual(repo.load(), s);
  repo.close();
});
test("Older backup states default to non-guest and keep existing records", () => {
  const s = initialState();
  const { guest: _guest, ...old } = s;
  assert.equal(_guest, false);
  assert.equal(validateState(old).guest, false);
});
for (const equipment of ["bodyweight", "dumbbells", "gym"] as const)
  test(`Personalized ${equipment} plan respects equipment, days, time and manual weights`, () => {
    const setup = {
      ...defaultSetup,
      equipment,
      location: equipment === "gym" ? "gym" : "home",
    } as Setup;
    const s = initialState();
    const { programs, reasons } = suggestPrograms(profile, setup, s.exercises);
    assert.deepEqual(
      programs.map((x) => x.day),
      [1, 3, 5],
    );
    assert.ok(reasons.length >= 4);
    for (const p of programs)
      for (const item of p.items) {
        const ex = s.exercises.find((x) => x.id === item.exerciseId)!;
        assert.equal(item.weight, 0);
        assert.equal(item.sets, 2);
        if (equipment === "bodyweight")
          assert.equal(ex.equipment, "Vücut ağırlığı");
        if (equipment === "dumbbells")
          assert.ok(["Vücut ağırlığı", "Dumbbell"].includes(ex.equipment));
      }
    const short = suggestPrograms(
      profile,
      { ...setup, minutes: 20 },
      s.exercises,
    );
    assert.ok(short.programs.every((x) => x.items.length <= 4));
  });
test("Four days produce alternating upper/lower; invalid frequency and restrictions blocked", () => {
  const s = initialState();
  const setup = {
    ...defaultSetup,
    days: [1, 2, 4, 5],
    experience: "intermediate",
  } as Setup;
  const generated = suggestPrograms(
    { ...profile, frequency: 4 },
    setup,
    s.exercises,
  );
  assert.match(generated.programs[0].name, /Üst/);
  assert.match(generated.programs[1].name, /Alt/);
  assert.throws(() =>
    suggestPrograms(
      profile,
      { ...defaultSetup, hasRestrictions: true },
      s.exercises,
    ),
  );
  assert.throws(() =>
    suggestPrograms(profile, { ...defaultSetup, days: [1, 1, 3] }, s.exercises),
  );
  assert.throws(() =>
    suggestPrograms(
      { ...profile, frequency: 7 },
      { ...defaultSetup, days: [0, 1, 2, 3, 4, 5, 6] },
      s.exercises,
    ),
  );
});
test("Onboarding commits profile, plans, baseline and reminders atomically; guest data remains", () => {
  let s = reduce(initialState(), { type: "guest" });
  s = reduce(s, { type: "water", date: "2026-10-16", value: 250 });
  const setup = { ...defaultSetup, reminderEnabled: true };
  const { programs } = suggestPrograms(profile, setup, s.exercises);
  const action = {
    type: "onboard",
    profile: { ...profile, setup },
    programs,
    replacePrograms: false,
  };
  s = reduce(s, action);
  assert.equal(s.guest, false);
  assert.equal(s.profile?.name, "Test Sporcu");
  assert.equal(s.programs.length, 3);
  assert.equal(s.measurements.length, 1);
  assert.equal(s.reminders.length, 1);
  assert.equal(s.water["2026-10-16"], 250);
  s = reduce(s, {
    ...action,
    profile: { ...profile, setup: { ...setup, source: "existing" } },
    programs: [],
  });
  assert.equal(s.measurements.length, 1);
  assert.equal(s.reminders.length, 1);
  assert.equal(s.programs.length, 3);
  const repo = new Repository(":memory:");
  repo.save(s);
  assert.deepEqual(repo.load(), s);
  assert.throws(() =>
    repo.save(
      reduce(s, {
        ...action,
        programs: [
          {
            ...programs[0],
            items: [{ ...programs[0].items[0], exerciseId: "unknown" }],
          },
        ],
      }),
    ),
  );
  assert.deepEqual(repo.load(), s);
  repo.close();
});
test("Estimated targets react to personal measurements and goal", () => {
  assert.notEqual(
    estimatedTargets(profile).calories,
    estimatedTargets({ ...profile, weight: 95 }).calories,
  );
  assert.equal(
    estimatedTargets({ ...profile, goal: "lose" }).calories,
    estimatedTargets(profile).calories - 300,
  );
});
