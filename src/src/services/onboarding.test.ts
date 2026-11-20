// AI-generated tests; a teammate reviews them in the pull request, per the
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

test("a first-time visitor has not seen the walkthrough", () => {
  assert.equal(hasSeenWalkthrough(memoryStorage()), false);
});

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
