import { Plus } from "lucide-react";
import type { ScheduleEvent } from "../types";
import { formatTime } from "../services/scheduler";
// One sample week, Monday (1) through Friday (5); events repeat by weekday.
const WEEKDAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
];
export function CalendarEvent({
  event,
  onClick,
}: {
  event: ScheduleEvent;
  onClick: () => void;
}) {
  return (
    <button
      className={`calendar-event ${event.color}`}
      onClick={onClick}
      title={`${event.title} · ${formatTime(event.start)} – ${formatTime(event.end)} · ${event.location}`}
      style={{
        top: `${((event.start - 480) / 720) * 100}%`,
        height: `${((event.end - event.start) / 720) * 100}%`,
      }}
    >
      <strong>{event.title}</strong>
      <span>
        {formatTime(event.start)} – {formatTime(event.end)}
      </span>
      <span>{event.location}</span>
    </button>
  );
}
export function ScheduleCalendar({
  events,
  semester,
  onAdd,
  onEvent,
}: {
  events: ScheduleEvent[];
  semester: string;
  onAdd: () => void;
  onEvent: (event: ScheduleEvent) => void;
}) {
  return (
    <section className="panel schedule">
      <div className="calendar-toolbar">
        <div>
          <h2>My Schedule</h2>
          <p>
            {semester} <span>•</span> Weekly View
          </p>
        </div>
        <div className="calendar-controls">
          <button className="primary add-event-button" onClick={onAdd}>
            <Plus size={19} />
            Add Event
          </button>
        </div>
      </div>
      <div className="calendar-scroll">
        <div className="time-calendar">
          <div
            className="calendar-day-headers"
            style={{
              gridTemplateColumns: `62px repeat(${WEEKDAYS.length},1fr)`,
            }}
          >
            <div />
            {WEEKDAYS.map((w) => (
              <div key={w.day}>
                <strong>{w.label}</strong>
              </div>
            ))}
          </div>
          <div
            className="time-grid"
            style={{
              gridTemplateColumns: `62px repeat(${WEEKDAYS.length},1fr)`,
            }}
          >
            <div className="time-labels">
              {Array.from({ length: 13 }, (_, i) => (
                <span key={i} style={{ top: `${(i / 12) * 100}%` }}>
                  {formatTime((i + 8) * 60)}
                </span>
              ))}
            </div>
            {WEEKDAYS.map((w) => (
              <div className="day-column" key={w.day}>
                {events
                  .filter((e) => e.days.includes(w.day))
                  .map((e) => (
                    <CalendarEvent
                      key={e.id}
                      event={e}
                      onClick={() => onEvent(e)}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
