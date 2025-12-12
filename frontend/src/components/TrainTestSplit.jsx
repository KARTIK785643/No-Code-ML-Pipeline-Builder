import React from "react";
import API from "../api/api";
import "./TrainTestSplit.css";

export default function TrainTestSplit({ disabled, onSplit }) {
  const doSplit = async (ratio) => {
    if (disabled) return alert("Preprocess or upload dataset first");
    try {
      await API.post("/split", { test_size: ratio });
      alert("Split done");
      onSplit();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Split failed");
    }
  };

  return (
    <div className="card">
      <h2>3. Train / Test Split</h2>
      <div className="split-options">
        <button className="btn" onClick={() => doSplit(0.3)}>70% Train / 30% Test</button>
        <button className="btn" onClick={() => doSplit(0.2)}>80% Train / 20% Test</button>
      </div>
      <div className="split-help hint">Choose split ratio before training.</div>
    </div>
  );
}
