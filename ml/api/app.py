"""FastAPI inference service for LeaseLens model.
Loads the full pipeline artifact saved during training, ensuring compatibility with the original class definitions.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Resolve project root directory
# Resolve project root (two levels up from this file)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "models", "rental_price_model.joblib")

# Ensure the ml/src directory is on sys.path so that the saved pipeline can import its classes.
ML_SRC_PATH = os.path.abspath(os.path.join(BASE_DIR, "ml", "src"))
if ML_SRC_PATH not in sys.path:
    sys.path.append(ML_SRC_PATH)

# Load the saved pipeline (LeaseLensModelPipeline) which includes the fitted preprocessor.
try:
    pipeline = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load pipeline artifact: {e}")

app = FastAPI(title="LeaseLens Prediction API")

class LeaseInput(BaseModel):
    BHK: int = Field(..., ge=0, description="Number of bedrooms")
    Size: float = Field(..., gt=0, description="Size in sqft")
    Bathroom: int = Field(..., ge=0, description="Number of bathrooms")
    Floor: str = Field(..., description="Floor description, e.g., '3 out of 5' or 'Ground'")
    City: str = Field(..., description="City name")
    Furnishing_Status: str = Field(..., description="Furnishing status")
    Tenant_Preferred: str = Field(..., description="Tenant preference")
    Area_Type: str = Field(..., description="Area type")

    class Config:
        allow_population_by_field_name = True

@app.post("/predict")
def predict(input: LeaseInput):
    """Return a monthly rent estimate in INR for a single listing.
    The pipeline's ``predict`` method already handles preprocessing, encoding, and
    the selected retransformation (naive exponential). It also clips to the
    business ceiling (2,000,000 INR) as defined in the pipeline.
    """
    try:
        payload = {
            "BHK": [input.BHK],
            "Size": [input.Size],
            "Bathroom": [input.Bathroom],
            "Floor": [input.Floor],
            "City": [input.City],
            "Furnishing Status": [input.Furnishing_Status],
            "Tenant Preferred": [input.Tenant_Preferred],
            "Area Type": [input.Area_Type],
            "Rent": [0.0],
        }
        df = pd.DataFrame(payload)
        # Use the pipeline's predict which returns final INR values.
        rent_pred = float(pipeline.predict(df)[0])
        return {"predicted_rent_inr": rent_pred}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
