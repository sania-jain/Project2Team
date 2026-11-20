export type WalkthroughStep = { title: string; body: string };

export const WALKTHROUGH_KEY = "hokie-scheduler:walkthrough-seen";

export const walkthroughSteps: WalkthroughStep[] = [
  {
    title: "Ask for courses",
    body: "Describe what you want in the request box, like “an easy CS elective that fits around my classes”, then press Find courses. Full sentences work better than one or two words.",
  },
  {
    title: "Narrow it down",
    body: "Use Filters to set the semester, major, difficulty, credits, time preference, and modality. Changing a filter clears old results, so submit your request again afterwards.",
  },
  {
    title: "Review recommendations",
    body: "AI Recommended Courses lists matching sections. Open one to see meeting times, sources, and reviews, then choose Add to Schedule. Sections that overlap your events are flagged.",
  },
  {
    title: "Manage your calendar",
    body: "My Schedule shows your classes and personal commitments. Use Add Event for things like work or practice, and click any event to see its details or remove it.",
  },
  {
    title: "Compare schedules",
    body: "Open Compare Schedules to try a balanced, lighter, or best-match option. Your personal events are kept, and a switch is cancelled if it would overlap them.",
  },
];

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

// Storage can be missing or throw (private browsing, blocked site data), so a
// failed read shows the walkthrough and a failed write is ignored.
export function hasSeenWalkthrough(storage?: ReadableStorage | null) {
  try {
    return storage?.getItem(WALKTHROUGH_KEY) === "true";
  } catch {
    return false;
  }
}

export function markWalkthroughSeen(storage?: WritableStorage | null) {
  try {
    storage?.setItem(WALKTHROUGH_KEY, "true");
  } catch {
    // Not remembering is fine; the walkthrough will show again next visit.
  }
}

export function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function clampStep(step: number) {
  return Math.min(Math.max(step, 0), walkthroughSteps.length - 1);
}
