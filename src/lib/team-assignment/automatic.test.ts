import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planAutomaticAssignments } from "./automatic";

const fixedRandom = () => 0.25;

describe("planAutomaticAssignments", () => {
  it("creates enough random teams and distributes participants evenly", () => {
    const plan = planAutomaticAssignments({
      participants: Array.from({ length: 11 }, (_, index) => ({ id: `p${index}`, role: null })),
      teams: [],
      mode: "random",
      targetTeamSize: 4,
      random: fixedRandom,
    });

    assert.equal(plan.newTeams.length, 3);
    assert.equal(plan.assignments.length, 11);
    assert.deepEqual(Object.values(plan.teamSizes).sort(), [3, 4, 4]);
  });

  it("balances random assignments around existing team sizes", () => {
    const plan = planAutomaticAssignments({
      participants: Array.from({ length: 5 }, (_, index) => ({ id: `p${index}`, role: null })),
      teams: [
        { id: "a", name: "Alpha", memberCount: 3 },
        { id: "b", name: "Beta", memberCount: 1 },
      ],
      mode: "random",
      targetTeamSize: 5,
      random: fixedRandom,
    });

    assert.equal(plan.newTeams.length, 0);
    assert.deepEqual(Object.values(plan.teamSizes).sort(), [4, 5]);
  });

  it("gives every leader a team and spreads participants evenly", () => {
    const plan = planAutomaticAssignments({
      participants: [
        { id: "l1", role: "leader" },
        { id: "l2", role: "leader" },
        ...Array.from({ length: 7 }, (_, index) => ({ id: `p${index}`, role: "participant" as const })),
      ],
      teams: [],
      mode: "role_balanced",
      targetTeamSize: 5,
      random: fixedRandom,
    });

    assert.equal(plan.newTeams.length, 2);
    assert.deepEqual(Object.values(plan.teamSizes).sort(), [4, 5]);
    assert.equal(new Set(plan.assignments.slice(0, 2).map((item) => item.teamKey)).size, 2);
  });

  it("reuses empty teams for leaders without changing occupied teams", () => {
    const plan = planAutomaticAssignments({
      participants: [{ id: "l1", role: "leader" }, { id: "p1", role: "participant" }],
      teams: [
        { id: "empty", name: "Ready Team", memberCount: 0 },
        { id: "occupied", name: "Existing Team", memberCount: 3 },
      ],
      mode: "role_balanced",
      targetTeamSize: 5,
      random: fixedRandom,
    });

    assert.equal(plan.newTeams.length, 0);
    assert.deepEqual(Object.keys(plan.teamSizes), ["empty"]);
  });

  it("requires a leader for role-balanced assignment", () => {
    assert.throws(() => planAutomaticAssignments({
      participants: [{ id: "p1", role: "participant" }],
      teams: [],
      mode: "role_balanced",
      targetTeamSize: 5,
      random: fixedRandom,
    }), /at least one unassigned leader/);
  });
});
