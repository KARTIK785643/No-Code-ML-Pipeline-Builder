# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import base64
import traceback

app = FastAPI(title="No-Code ML Pipeline Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATE = {
    "raw_df": None,
    "df": None,
    "encoders": {},
    "X_train": None,
    "X_test": None,
    "y_train": None,
    "y_test": None,
    "model": None,
}

class PreprocessReq(BaseModel):
    method: str

class SplitReq(BaseModel):
    test_size: float

class TrainReq(BaseModel):
    model: str

def encode_fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return "data:image/png;base64," + base64.b64encode(buf.read()).decode()

def ensure_df_present():
    if STATE["df"] is None:
        raise HTTPException(status_code=400, detail="Upload a dataset first!")

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV, XLS, XLSX allowed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Reading failed: {str(e)}")

    if df.shape[1] < 2:
        raise HTTPException(status_code=400, detail="Dataset must have at least 2 columns.")

    encoders = {}
    df_encoded = df.copy()
    # drop obvious problematic columns
    for bad in ("Name", "Ticket", "Cabin"):
        if bad in df_encoded.columns:
            df_encoded = df_encoded.drop(columns=[bad])

    for col in df_encoded.columns:
        if df_encoded[col].dtype == object or str(df_encoded[col].dtype).startswith("category"):
            le = LabelEncoder()
            df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
            encoders[col] = le

    STATE["raw_df"] = df
    STATE["df"] = df_encoded
    STATE["encoders"] = encoders
    STATE["X_train"] = STATE["X_test"] = STATE["y_train"] = STATE["y_test"] = None
    STATE["model"] = None

    return {
        "filename": file.filename,
        "rows": df.shape[0],
        "cols": df.shape[1],
        "columns": list(df.columns),
        "preview": df.head(5).to_dict(orient="records")
    }

@app.post("/preprocess")
async def preprocess(req: PreprocessReq):
    ensure_df_present()
    df = STATE["df"]
    method = req.method.lower()
    if method not in ("standard", "minmax"):
        raise HTTPException(status_code=400, detail="method must be standard or minmax")
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    target_col = df.columns[-1]
    if target_col in numeric_cols:
        numeric_cols.remove(target_col)
    if not numeric_cols:
        return {"status": "no_numeric_columns"}
    scaler = StandardScaler() if method == "standard" else MinMaxScaler()
    try:
        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scaling failed: {str(e)}")
    STATE["df"] = df
    STATE["X_train"] = STATE["X_test"] = STATE["y_train"] = STATE["y_test"] = None
    STATE["model"] = None
    return {"status": "preprocessing_applied", "scaled_columns": numeric_cols}

@app.post("/split")
async def split(req: SplitReq):
    ensure_df_present()
    df = STATE["df"].copy()
    df = df.dropna()
    if df.shape[0] < 2:
        raise HTTPException(status_code=400, detail="Not enough data after dropping NaNs.")
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]
    stratify = y if y.nunique() > 1 else None
    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=req.test_size, random_state=42, stratify=stratify)
    except Exception:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=req.test_size, random_state=42)
    STATE["X_train"], STATE["X_test"], STATE["y_train"], STATE["y_test"] = X_train, X_test, y_train, y_test
    STATE["model"] = None
    return {"status": "split_done", "train_rows": len(X_train), "test_rows": len(X_test)}

@app.post("/train")
async def train(req: TrainReq):
    ensure_df_present()
    if STATE["X_train"] is None:
        raise HTTPException(status_code=400, detail="Split the dataset first")
    model_choice = req.model.lower().strip()
    if model_choice == "logistic":
        model = LogisticRegression(max_iter=2000, solver="liblinear")
    elif model_choice == "tree":
        model = DecisionTreeClassifier()
    else:
        raise HTTPException(status_code=400, detail="Model must be logistic or tree")
    X_train, X_test = STATE["X_train"], STATE["X_test"]
    y_train, y_test = STATE["y_train"], STATE["y_test"]
    try:
        model.fit(X_train, y_train)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}\n{traceback.format_exc()}")
    preds = model.predict(X_test)
    accuracy = float(accuracy_score(y_test, preds))
    report = classification_report(y_test, preds, output_dict=True)
    try:
        cm = confusion_matrix(y_test, preds)
        fig, ax = plt.subplots(figsize=(4, 3))
        ax.imshow(cm, cmap="Blues")
        ax.set_title("Confusion Matrix")
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        cm_b64 = encode_fig_to_base64(fig)
    except Exception:
        cm_b64 = None
    STATE["model"] = model
    STATE["last_metrics"] = {"accuracy": accuracy, "report": report}
    STATE["last_confusion_b64"] = cm_b64
    return {"status": "model_trained", "accuracy": accuracy, "report": report, "confusion_matrix_base64": cm_b64}

@app.post("/reset")
async def reset():
    for k in list(STATE.keys()):
        STATE[k] = None
    return {"status": "reset_done"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
