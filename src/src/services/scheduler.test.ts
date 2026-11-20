import { mockRecommendCourses } from "./mockScheduler";
import test from "node:test";
import assert from "node:assert/strict";
import {
  conflicts,
  dateKey,
  filterCourses,
  formatTime,
  meetingDays,
  occursOn,
  recommendCourses,
} from "./scheduler";
import {
  baseEvents,
  courses,
  defaultFilters,
  personalEvents,
} from "../data/mockData";
test("adjacent meetings do not conflict, overlapping recurring meetings do", () => {
  const a = baseEvents[0];
  assert.equal(conflicts(a, { ...a, start: a.end, end: a.end + 60 }), false);
  assert.equal(conflicts(a, { ...a, start: a.start + 20 }), true);
  assert.equal(conflicts(a, { ...a, days: [2] }), false);
});
test("date-specific commitments do not repeat", () => {
  const event = { ...personalEvents[0], date: "2026-08-25" };
  assert.equal(occursOn(event, new Date(2026, 7, 25)), true);
  assert.equal(occursOn(event, new Date(2026, 8, 1)), false);
  assert.equal(conflicts(event, { ...event, date: "2026-09-01" }), false);
  assert.equal(
    conflicts(event, { ...event, date: undefined, days: [2] }),
    true,
  );
});
test("filters combine rather than ignore constraints", () => {
  assert.deepEqual(
    filterCourses(courses, {
      ...defaultFilters,
      modality: "Online",
      rating: "4.5+",
    }).map((c) => c.id),
    ["ENGL 3764"],
  );
  assert.equal(
    filterCourses(courses, { ...defaultFilters, credits: "4" }).length,
    0,
  );
});
test("prompt recommendations respect existing commitments", async () => {
  const result = await mockRecommendCourses({
    prompt: "A 3 credit class on Fridays",
    filters: defaultFilters,
    events: [...baseEvents, ...personalEvents],
  });
  assert.deepEqual(
    result.courses.map((c) => c.id),
    ["ENGL 3764"],
  );
  const blocked = await mockRecommendCourses({
    prompt: "CS electives",
    filters: defaultFilters,
    events: [...baseEvents, ...personalEvents, courses[0].meeting],
  });
  assert.ok(!blocked.courses.some((c) => c.id === "CS 3724"));
});

// --- Added by the @tester verification agent (Task 4, test skill). ---
// Edge cases: zero-padded date keys, weekday versus date-specific events in
// either argument order, midnight/noon formatting, each time-of-day filter
// boundary, and the recommendation API's success and error responses.
test("dateKey zero-pads month and day", () => {
  assert.equal(dateKey(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(dateKey(new Date(2026, 11, 31)), "2026-12-31");
});
test("recurring events occur only on their listed weekdays", () => {
  const event = { ...baseEvents[0], date: undefined, days: [1, 3] };
  assert.equal(occursOn(event, new Date(2026, 7, 24)), true); // Monday
  assert.equal(occursOn(event, new Date(2026, 7, 25)), false); // Tuesday
});
test("a recurring event conflicts with a dated one on the same weekday, in either order", () => {
  const recurring = { ...baseEvents[0], date: undefined, days: [2] };
  const dated = { ...recurring, days: [], date: "2026-08-25" }; // a Tuesday
  assert.equal(conflicts(recurring, dated), true);
  assert.equal(conflicts(dated, recurring), true);
  assert.equal(conflicts(recurring, { ...dated, date: "2026-08-26" }), false);
});
test("formatTime handles midnight, noon, and evening", () => {
  assert.equal(formatTime(0), "12:00 AM");
  assert.equal(formatTime(9 * 60 + 5), "9:05 AM");
  assert.equal(formatTime(720), "12:00 PM");
  assert.equal(formatTime(1170), "7:30 PM");
});
test("meetingDays names weekdays in order and handles no days", () => {
  assert.equal(meetingDays([1, 3, 5]), "Mon / Wed / Fri");
  assert.equal(meetingDays([]), "");
});
test("time-of-day filters split at noon and 5 PM", () => {
  const at = (start: number) => ({
    ...courses[0],
    major: "Computer Science",
    meeting: { ...courses[0].meeting, start, end: start + 50 },
  });
  const pool = [at(719), at(720), at(1019), at(1020)];
  const starts = (time: string) =>
    filterCourses(pool, { ...defaultFilters, major: "Any", time }).map(
      (c) => c.meeting.start,
    );
  assert.deepEqual(starts("Morning"), [719]);
  assert.deepEqual(starts("Afternoon"), [720, 1019]);
  assert.deepEqual(starts("Evening"), [1020]);
  assert.equal(starts("No Preference").length, 4);
});
test("recommendCourses posts the request and returns the server's JSON", async () => {
  const real = globalThis.fetch;
  const request = { prompt: "CS electives", filters: defaultFilters, events: [] };
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    assert.equal(url, "/api/recommendations");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(String(init.body)), request);
    return new Response(JSON.stringify({ courses: [] }));
  }) as unknown as typeof fetch;
  try {
    assert.deepEqual(await recommendCourses(request as never), { courses: [] });
  } finally {
    globalThis.fetch = real;
  }
});
test("recommendCourses surfaces the server error, or a default when there is none", async () => {
  const real = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: "Quota exceeded" }), {
        status: 503,
      })) as unknown as typeof fetch;
    await assert.rejects(recommendCourses({} as never), /Quota exceeded/);
    globalThis.fetch = (async () =>
      new Response("<html>", { status: 502 })) as unknown as typeof fetch;
    await assert.rejects(recommendCourses({} as never), /npm run dev/);
  } finally {
    globalThis.fetch = real;
  }
});
