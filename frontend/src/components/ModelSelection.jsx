import React from "react";
import API from "../api/api";
import "./ModelSelection.css";

export default function ModelSelection({ disabled, setResults }) {
  const train = async (model) => {
    if (disabled) return alert("Perform split first");
    try {
      const res = await API.post("/train", { model });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Training failed (check backend logs)");
    }
  };

  return (
    <div className="card">
      <h2>4. Select Model</h2>
      <div className="model-list">
        <div className="model-card" onClick={() => train("logistic")}>
          <div className="model-name">Logistic Regression</div>
          <div className="model-desc">Fast linear classifier — good for binary classification.</div>
        </div>
        <div className="model-card" onClick={() => train("tree")}>
          <div className="model-name">Decision Tree</div>
          <div className="model-desc">Non-linear, interpretable tree-based classifier.</div>
        </div>
      </div>
    </div>
  );
}
