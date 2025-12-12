import React, { useState } from "react";
import API from "../api/api";
import "./DatasetUpload.css";

export default function DatasetUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);

  const upload = async () => {
    if (!file) { alert("Choose a CSV/XLSX file"); return; }
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await API.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setMeta(res.data);
      onUploaded(res.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Upload failed");
    }
  };

  return (
    <div className="card">
      <h2>1. Upload Dataset</h2>
      <input className="file-input" type="file" accept=".csv,.xls,.xlsx" onChange={e => setFile(e.target.files[0])} />
      <div style={{marginTop:10, display:"flex", gap:8}}>
        <button className="btn btn-primary" onClick={upload}>Upload</button>
        <button className="btn btn-ghost" onClick={() => { setFile(null); setMeta(null); onUploaded(null); }}>Reset</button>
      </div>
      {meta && (
        <div className="preview" style={{marginTop:12}}>
          <div><b>Rows:</b> {meta.rows} <b style={{marginLeft:12}}>Cols:</b> {meta.cols}</div>
          <div className="hint" style={{marginTop:6}}><b>Columns:</b> {meta.columns.join(", ")}</div>
        </div>
      )}
    </div>
  );
}
