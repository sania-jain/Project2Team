import { useState } from "react";
import { Modal } from "./Modal";
import { clampStep, walkthroughSteps } from "../services/onboarding";
export function Walkthrough({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = walkthroughSteps[step];
  const last = step === walkthroughSteps.length - 1;
  return (
    <Modal title="Welcome to Hokie Scheduler" onClose={onClose}>
      <p className="muted modal-intro">
        Step {step + 1} of {walkthroughSteps.length}
      </p>
      <div className="walkthrough-step" aria-live="polite">
        <h3>{current.title}</h3>
        <p>{current.body}</p>
      </div>
      <ol className="walkthrough-dots" aria-label="Walkthrough progress">
        {walkthroughSteps.map((s, i) => (
          <li key={s.title}>
            <button
              className={i === step ? "active" : ""}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
            />
          </li>
        ))}
      </ol>
      <div className="modal-footer">
        {step === 0 ? (
          <button className="secondary" onClick={onClose}>
            Skip
          </button>
        ) : (
          <button
            className="secondary"
            onClick={() => setStep(clampStep(step - 1))}
          >
            Back
          </button>
        )}
        <button
          className="primary"
          onClick={() => (last ? onClose() : setStep(clampStep(step + 1)))}
        >
          {last ? "Get started" : "Next"}
        </button>
      </div>
    </Modal>
  );
}
