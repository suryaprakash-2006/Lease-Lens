# LeaseLens — Machine Learning Integration Plan

## 1. Overview
The machine learning component of **LeaseLens** powers data-driven rental price intelligence. Unlike decorative or mock implementations, this component uses empirical data, proper offline experimentation, metric-driven model selection, and a clean inference microservice.

---

## 2. Dataset Selection & Criteria

To maintain academic rigor and high data quality, candidate datasets will be evaluated against:
1. **Source & Licensing**: Transparent provenance (e.g., Kaggle Indian Rental Housing Datasets, open government real estate registries) with permissible academic use.
2. **Geographical Relevance**: Standardized metro/urban rental data (e.g., Chennai, Bangalore, Mumbai, Delhi, Hyderabad, Pune).
3. **Feature Richness**:
   * Continuous features: Area in sq. ft., number of bathrooms, BHK/bedrooms.
   * Categorical features: City, Locality, Furnishing Status (Furnished, Semi-Furnished, Unfurnished), Tenant preferred (Bachelors/Family), Parking availability.
4. **Data Quality & Integrity**:
   * Minimum dataset volume: 5,000+ rental listings.
   * Low proportion of missing target values (`Rent`).
   * No data leakage (excluding post-transaction attributes).
   * Outlier handling strategy (removing extreme erroneous rent or square footage entries via IQR / percentile capping).

---

## 3. ML Development & Training Pipeline

```
  Raw Dataset (CSV)
         |
         v
  Exploratory Data Analysis (EDA)
  - Distribution of Rent, log-transform if skewed
  - Correlation matrices, scatter analysis
         |
         v
  Data Cleaning & Preprocessing
  - Impute missing values (median for numerical, mode for categorical)
  - One-Hot Encoding for categorical features (City, Furnishing)
  - Standard scaling for continuous features (Area, BHK)
         |
         v
  Train / Validation / Test Split (e.g., 70% Train, 15% Validation, 15% Test)
         |
         v
  Model Benchmarking & Comparison
  - Baseline: Linear / Ridge Regression
  - Ensemble 1: Random Forest Regressor
  - Ensemble 2: Gradient Boosting Regressor / LightGBM / XGBoost
         |
         v
  Evaluation Metrics (evaluated on unseen test set)
  - Mean Absolute Error (MAE)
  - Root Mean Squared Error (RMSE)
  - Coefficient of Determination (R²)
         |
         v
  Model Serialization
  - Export unified pipeline (preprocessing + regressor) via `joblib` into `ml/models/model_v1.joblib`
```

---

## 4. Serving Architecture (FastAPI Microservice)

* **Directory Structure**:
  ```
  ml/
  ├── data/
  │   ├── raw/
  │   └── processed/
  ├── notebooks/
  │   └── 01_eda_and_model_experiments.ipynb
  ├── src/
  │   ├── preprocessing.py
  │   ├── train.py
  │   ├── evaluate.py
  │   └── api.py
  ├── models/
  │   ├── pipeline_v1.joblib
  │   └── metadata.json
  ├── requirements.txt
  └── README.md
  ```
* **FastAPI Service (`ml/src/api.py`)**:
  * Loads the serialized pipeline once at startup (`@app.on_event("startup")` or lifespan context).
  * Validates request payloads using Pydantic schemas.
  * Runs vectorized `pipeline.predict(df)` and calculates estimation bounds.
  * Returns JSON containing point estimate, estimated range, and model version metadata.

---

## 5. Integration with Express Backend

1. **Isolation**: Express acts as the single gateway for the React client. The React client never queries the ML service directly.
2. **Resilience & Fallback**:
   * Express sets a 3-second timeout when calling `http://localhost:8000/predict/rent`.
   * If the ML service is unreachable or in development mode, Express returns a descriptive status (`ML service offline or model in training phase`), avoiding uncaught crashes.
3. **Audit Logging**: Every completed prediction can optionally be logged into MongoDB's `predictions` collection for user history.
