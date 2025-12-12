import React from "react";
import "./Results.css";

export default function Results({ results, preview }) {
  if (!results) {
    return (
      <div className="card">
        <h2>Results</h2>
        <div className="empty">No results yet. Train a model to see metrics.</div>
        {preview && (
          <div style={{marginTop:12}}>
            <h3>Dataset preview</h3>
            <table className="table-preview">
              <thead>
                <tr>
                  {Object.keys(preview[0] || {}).map((c) => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}>
                    {Object.keys(preview[0]).map((c) => <td key={c}>{String(r[c])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Results</h2>
      <div className="metric-box">
        <div>
          <div className="metric">{(results.accuracy * 100).toFixed(2)}%</div>
          <div className="metric-label">Accuracy</div>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <h3>Classification Report</h3>
        <pre className="report">{JSON.stringify(results.report, null, 2)}</pre>
      </div>

      {results.confusion_matrix_base64 && (
        <div style={{marginTop:12}}>
          <h3>Confusion Matrix</h3>
          <img alt="confusion" src={results.confusion_matrix_base64} style={{maxWidth:"100%", borderRadius:8}} />
        </div>
      )}
    </div>
  );
}
