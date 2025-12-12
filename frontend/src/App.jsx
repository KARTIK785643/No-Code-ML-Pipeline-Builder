import React, { useState } from "react";
import DatasetUpload from "./components/DatasetUpload";
import Preprocessing from "./components/Preprocessing";
import TrainTestSplit from "./components/TrainTestSplit";
import ModelSelection from "./components/ModelSelection";
import Results from "./components/Results";
import PipelineStepper from "./components/PipelineStepper";
import "./App.css";

function App() {
  const [uploaded, setUploaded] = useState(null); // upload response
  const [preprocessed, setPreprocessed] = useState(false);
  const [splitDone, setSplitDone] = useState(false);
  const [results, setResults] = useState(null);

  return (
    <div className="container">
      <h1 className="title">No-Code ML Pipeline Builder (Stepper)</h1>
      <p className="subtitle">Follow steps: Upload → Preprocess → Split → Model → Results</p>

      <div className="layout">
        <div className="left-col">
          <PipelineStepper
            uploaded={!!uploaded}
            preprocessed={preprocessed}
            splitDone={splitDone}
            trained={!!results}
          />

          <DatasetUpload onUploaded={(res) => { setUploaded(res); setPreprocessed(false); setSplitDone(false); setResults(null); }} />

          <Preprocessing
            disabled={!uploaded}
            onApplied={() => { setPreprocessed(true); setSplitDone(false); setResults(null); }}
          />

          <TrainTestSplit
            disabled={!preprocessed && !uploaded}
            onSplit={() => { setSplitDone(true); setResults(null); }}
          />

          <ModelSelection
            disabled={!splitDone}
            setResults={(r) => { setResults(r); }}
          />
        </div>

        <div className="right-col">
          <Results results={results} preview={uploaded && uploaded.preview} />
        </div>
      </div>
    </div>
  );
}

export default App;
