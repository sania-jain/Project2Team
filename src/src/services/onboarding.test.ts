// AI-generated tests; @ac tags and the last two tests added by the @tester
// verification agent (Task 4). A teammate reviews them in the pull request, per the
// team AI policy.
// Prompt: "Write node:test unit tests for every function in
// src/services/onboarding.ts, including storage that is missing or throws."
import test from "node:test";
import assert from "node:assert/strict";
import {
  WALKTHROUGH_KEY,
  browserStorage,
  clampStep,
  hasSeenWalkthrough,
  markWalkthroughSeen,
  walkthroughSteps,
} from "./onboarding";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

const throwing = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

// @ac US-003.AC1
test("a first-time visitor has not seen the walkthrough", () => {
  assert.equal(hasSeenWalkthrough(memoryStorage()), false);
});

// @ac US-003.AC5
// @ac US-003.AC6
test("closing the walkthrough is remembered for the next visit", () => {
  const storage = memoryStorage();
  markWalkthroughSeen(storage);
  assert.equal(storage.getItem(WALKTHROUGH_KEY), "true");
  assert.equal(hasSeenWalkthrough(storage), true);
});

test("unexpected stored values do not count as seen", () => {
  const storage = memoryStorage();
  storage.setItem(WALKTHROUGH_KEY, "false");
  assert.equal(hasSeenWalkthrough(storage), false);
});

// @ac US-003.AC8
test("missing or blocked storage shows the walkthrough and never throws", () => {
  assert.equal(hasSeenWalkthrough(null), false);
  assert.equal(hasSeenWalkthrough(undefined), false);
  assert.equal(hasSeenWalkthrough(throwing), false);
  assert.doesNotThrow(() => markWalkthroughSeen(null));
  assert.doesNotThrow(() => markWalkthroughSeen(throwing));
});

test("browserStorage returns null outside a browser", () => {
  assert.equal(browserStorage(), null);
});

// @ac US-003.AC2
test("clampStep keeps navigation inside the walkthrough", () => {
  const last = walkthroughSteps.length - 1;
  assert.equal(clampStep(-1), 0);
  assert.equal(clampStep(0), 0);
  assert.equal(clampStep(2), 2);
  assert.equal(clampStep(last + 1), last);
});

test("every step has a title and instructions", () => {
  assert.ok(walkthroughSteps.length >= 3);
  for (const step of walkthroughSteps) {
    assert.ok(step.title.trim());
    assert.ok(step.body.trim());
  }
  const titles = walkthroughSteps.map((s) => s.title);
  assert.equal(new Set(titles).size, titles.length);
});

// @ac US-003.AC1
test("the walkthrough has exactly five steps, so step 1 reads 'Step 1 of 5'", () => {
  assert.equal(walkthroughSteps.length, 5);
});

// @ac US-003.AC9
test("each step names a real part of the interface, in order", () => {
  const parts = [
    "request box",
    "Filters",
    "AI Recommended Courses",
    "My Schedule",
    "Compare Schedules",
  ];
  parts.forEach((part, i) =>
    assert.ok(
      walkthroughSteps[i].body.includes(part),
      `step ${i + 1} should mention "${part}"`,
    ),
  );
});
