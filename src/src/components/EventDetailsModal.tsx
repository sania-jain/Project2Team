import { useState } from "react";
import { Modal } from "./Modal";
import { formatTime, meetingDays } from "../services/scheduler";
import type { ScheduleEvent } from "../types";
export function EventDetailsModal({
  event,
  onClose,
  onRemove,
}: {
  event: ScheduleEvent;
  onClose: () => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Modal title={event.title} onClose={onClose}>
      <dl className="detail-grid">
        {event.courseName && (
          <div>
            <dt>Course</dt>
            <dd>{event.courseName}</dd>
          </div>
        )}
        <div>
          <dt>When</dt>
          <dd>{event.date ?? meetingDays(event.days)}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {formatTime(event.start)} – {formatTime(event.end)}
          </dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{event.location || "No location set"}</dd>
        </div>
        {event.notes && (
          <div>
            <dt>Notes</dt>
            <dd>{event.notes}</dd>
          </div>
        )}
      </dl>
      {confirming ? (
        <>
          <p role="alert" className="form-error remove-confirm">
            Remove {event.title} from your schedule? This can't be undone.
          </p>
          <div className="modal-footer">
            {/* Focus lands on the safe choice, so Enter doesn't delete. */}
            <button
              className="secondary"
              autoFocus
              onClick={() => setConfirming(false)}
            >
              Keep it
            </button>
            <button className="primary" onClick={onRemove}>
              Yes, remove
            </button>
          </div>
        </>
      ) : (
        <div className="modal-footer">
          <button className="secondary" onClick={onClose}>
            Close
          </button>
          <button className="primary" onClick={() => setConfirming(true)}>
            Remove from schedule
          </button>
        </div>
      )}
    </Modal>
  );
}
