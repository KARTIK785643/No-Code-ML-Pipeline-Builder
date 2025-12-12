import React from "react";
import "./PipelineStepper.css";

export default function PipelineStepper({ uploaded, preprocessed, splitDone, trained }) {
  const steps = [
    { id: 1, name: "Upload", done: uploaded },
    { id: 2, name: "Preprocess", done: preprocessed },
    { id: 3, name: "Split", done: splitDone },
    { id: 4, name: "Model", done: trained },
    { id: 5, name: "Results", done: trained },
  ];
  return (
    <div className="card">
      <h2>Pipeline</h2>
      <div className="stepper">
        {steps.map((s) => (
          <div key={s.id} className={`step ${s.done ? "done" : ""}`}>
            <div className="dot">{s.done ? "✓" : s.id}</div>
            <div className="label">{s.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

