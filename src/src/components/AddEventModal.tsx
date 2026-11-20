import { useState } from "react";
import { Modal } from "./Modal";
import type { ScheduleEvent } from "../types";
const WEEKDAYS = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
];
export function AddEventModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
}) {
  const [error, setError] = useState("");
  return (
    <Modal title="Make room for your life" onClose={onClose}>
      <p className="muted modal-intro">
        Classes are only part of your week. Add the things that matter.
      </p>
      <form
        className="event-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const time = (key: string) => {
            const [h, m] = String(data.get(key)).split(":").map(Number);
            return h * 60 + m;
          };
          const start = time("start"),
            end = time("end");
          if (end <= start) {
            setError("End time must be after start time.");
            return;
          }
          if (start < 480 || end > 1200) {
            setError(
              "For this prototype, choose a time between 8:00 AM and 8:00 PM.",
            );
            return;
          }
          onSave({
            id: crypto.randomUUID(),
            title: String(data.get("name")).trim(),
            days: [Number(data.get("day"))],
            start,
            end,
            location: String(data.get("location")).trim(),
            notes: String(data.get("notes")).trim(),
            color: "green",
          });
        }}
      >
        <label>
          Event name
          <input
            name="name"
            required
            maxLength={60}
            placeholder="Study session, work, coffee with friends…"
            autoFocus
          />
        </label>
        <label>
          Day of the week
          <select name="day" defaultValue="1" required>
            {WEEKDAYS.map((w) => (
              <option key={w.day} value={w.day}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Start time
            <input type="time" name="start" defaultValue="15:00" required />
          </label>
          <label>
            End time
            <input type="time" name="end" defaultValue="16:00" required />
          </label>
        </div>
        <label>
          Location
          <input
            name="location"
            placeholder="Where will you be?"
            maxLength={100}
          />
        </label>
        <label>
          Notes <span className="muted">(optional)</span>
          <textarea
            name="notes"
            placeholder="Anything else to remember"
            maxLength={500}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">Save event</button>
        </div>
      </form>
    </Modal>
  );
}
