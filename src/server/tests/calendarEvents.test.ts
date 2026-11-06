// AI-generated tests (Claude): backend side of the PR #1 calendar changes.
import test from "node:test";
import assert from "node:assert/strict";
import { requestSchema, type Dependencies } from "../contracts";
import { parseTimetable } from "../providers/vt";
import { eligible, recommend } from "../recommend";
import {
  baseEvents,
  defaultFilters,
  personalEvents,
} from "../../src/data/mockData";

const row = (crn: string, course: string, name: string, type = "L") =>
  `<tr><td>${crn}</td><td>${course}</td><td>${name}</td><td>${type}</td><td>Face-to-Face Instruction</td><td>3</td><td>40</td><td>N/A</td><td>T R</td><td>10:00AM</td><td>11:15AM</td><td>MCB 100</td><td>10T</td></tr>`;
const table = (...rows: string[]) =>
  `<table summary="This table displays the Timetable of Classes">${rows.join("")}</table>`;

test("parseTimetable gives each section's meeting its own class name", () => {
  const parsed = parseTimetable(
    table(
      row("12345", "CS-3724", "Human Computer Interaction"),
      row("12346", "MATH-2204", "Multivariable Calculus"),
    ),
    "Fall 2026",
  );
  assert.deepEqual(
    parsed.map((c) => [c.meeting.title, c.meeting.courseName]),
    [
      ["CS 3724", "Human Computer Interaction"],
      ["MATH 2204", "Multivariable Calculus"],
    ],
  );
});

test("parseTimetable cleans markup out of the class name", () => {
  const [course] = parseTimetable(
    table(row("12345", "CS-3114", "  Data &amp;\n  Algorithms ")),
    "Fall 2026",
  );
  assert.equal(course.meeting.courseName, "Data & Algorithms");
});

test("parseTimetable keeps the class name on unverified sections", () => {
  const [lab] = parseTimetable(
    table(row("12345", "CS-3724", "Human Computer Interaction", "B")),
    "Fall 2026",
  );
  assert.equal(lab.scheduleVerified, false);
  assert.equal(lab.meeting.courseName, "Human Computer Interaction");
});

const html = table(row("12345", "CS-3724", "Human Computer Interaction"));
const course = parseTimetable(html, "Fall 2026")[0];
const baseRequest = {
  prompt: "Show me CS electives",
  filters: defaultFilters,
  events: [...baseEvents, ...personalEvents],
};
const deps: Dependencies = {
  timetable: async () => ({
    items: [course],
    status: { source: "vt-timetable", state: "ready", detail: "test" },
  }),
  catalog: async () => ({
    items: [],
    status: { source: "vt-catalog", state: "unavailable", detail: "test" },
  }),
  reviews: async () => ({
    items: [],
    status: {
      source: "ratemyprofessors",
      state: "not-configured",
      detail: "test",
    },
  }),
  reddit: async () => ({
    items: [],
    status: { source: "reddit", state: "not-configured", detail: "test" },
  }),
};

test("requestSchema accepts events with courseName and strips it", () => {
  const parsed = requestSchema.parse(baseRequest);
  assert.equal(parsed.events.length, baseRequest.events.length);
  assert.ok(parsed.events.every((e) => !("courseName" in e)));
});

test("requestSchema accepts the event shape AddEventModal now saves", () => {
  const parsed = requestSchema.safeParse({
    ...baseRequest,
    events: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Study group",
        days: [4],
        start: 540,
        end: 600,
        location: "",
        notes: "",
        color: "green",
      },
    ],
  });
  assert.equal(parsed.success, true);
});

// Integration: parser, request validation and recommender together.
test("recommend returns the meeting with its class name intact", async () => {
  const result = await recommend(requestSchema.parse(baseRequest), deps);
  const found = result.courses.find((c) => c.id === "CS 3724");
  assert.ok(found, "CS 3724 should be recommended");
  assert.equal(found.meeting.courseName, "Human Computer Interaction");
});

test("a weekday-only personal event blocks overlapping recommendations", () => {
  const personal = {
    id: "tutoring",
    title: "Tutoring",
    start: 10 * 60 + 30,
    end: 11 * 60 + 30,
    location: "",
    color: "green" as const,
  };
  const request = requestSchema.parse(baseRequest);
  const withEvent = (days: number[]) => ({
    ...request,
    events: [{ ...personal, days }],
  });
  assert.equal(eligible(course, withEvent([2])), false, "same day and time");
  assert.equal(eligible(course, withEvent([1])), true, "different weekday");
});
