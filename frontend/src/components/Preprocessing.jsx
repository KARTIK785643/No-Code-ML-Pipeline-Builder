import React from "react";
import API from "../api/api";
import "./Preprocessing.css";

export default function Preprocessing({ disabled, onApplied }) {
  const apply = async (method) => {
    if (disabled) return alert("Upload dataset first");
    try {
      await API.post("/preprocess", { method });
      alert("Preprocessing applied");
      onApplied();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Preprocess failed");
    }
  };

  return (
    <div className="card">
      <h2>2. Preprocessing</h2>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => apply("standard")}>Standardize</button>
        <button className="btn btn-primary" onClick={() => apply("minmax")}>Normalize</button>
      </div>
      <div className="hint" style={{marginTop:8}}>Scaling will not change the target column.</div>
    </div>
  );
}
