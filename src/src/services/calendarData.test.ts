// AI-generated tests (Claude): demo data changed by PR #1.
import test from "node:test";
import assert from "node:assert/strict";
import { baseEvents, courses, options } from "../data/mockData";

test("every demo course meeting names the same class as its course", () => {
  assert.ok(courses.length > 0);
  for (const course of courses) {
    assert.equal(course.meeting.courseName, course.name, course.id);
    assert.equal(course.meeting.title, course.id);
  }
});

test("ENG 1104 is fully renamed to ENGE 1104", () => {
  const enge = baseEvents.find((e) => e.courseId === "ENGE 1104");
  assert.equal(enge?.id, "enge1104");
  assert.equal(enge?.title, "ENGE 1104");
  assert.equal(enge?.courseName, "Exploring the Digital Future");
  assert.doesNotMatch(JSON.stringify(baseEvents), /\bENG 1104\b|"eng1104"/);
});

test("comparison options still point at real demo courses", () => {
  for (const option of options) {
    if (option.courseId)
      assert.ok(
        courses.some((c) => c.id === option.courseId),
        option.courseId,
      );
  }
});
