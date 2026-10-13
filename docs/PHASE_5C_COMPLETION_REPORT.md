# LeaseLens — Phase 5C Completion Report
**Phase:** Phase 5C: Model Training, Evaluation & Audited Benchmarking  
**Status:** COMPLETE (Awaiting authorization before Phase 5D)  
**Date:** 2026-10-13  
**Commit Baseline:** `426dfd1b3f81f2992e02dc7c5dec7a6f6b569059` (Phase 5B)  

---

## 1. Executive Summary

Phase 5C has been completed with full statistical rigor, empirical cross-validation benchmarking, and zero-leakage held-out test evaluation.

### Key Milestones Delivered:
1. **Audited Cross-Validation Architecture:** Corrected the benchmarking pipeline to guarantee zero in-sample leakage: `RentalPreprocessor` and `StandardScaler` are fitted strictly within each training fold (3,020 samples).
2. **Comprehensive Model Comparison:** Tested 18 distinct configurations across Baselines (Dummy Mean, Dummy Median, City Median), Linear Regression, Ridge, Lasso, Random Forest, Gradient Boosting, and XGBoost on identical 5-fold CV splits.
3. **Target Transformation & Bias Handling:** Compared raw-rent against log-rent modeling. Formulated and tested both naive median inversion (`expm1`) and Duan’s non-parametric smearing correction (`s = 1.0645`), documenting the empirical trade-off between conditional median estimation and mean retransformation bias.
4. **Model Selection:** Selected **Gradient Boosting Regressor on `log1p(Rent)`** based on lowest cross-validated MAE (₹10,955) and MedAE (₹3,671).
5. **Held-Out Test Set Isolation:** The 944-sample test partition remained completely untouched during model selection, and was evaluated exactly once.
6. **Final Evaluation:** On the held-out test set, the final model achieved **MAE = ₹10,589.90**, **MedAE = ₹3,728.91**, **RMSE = ₹28,181.80**, **R² = 0.6998**, and **46.08% within ±20%** of actual rent.
7. **Regression Suite Maintained:** All 158 existing backend and frontend integration tests, plus 8 new ML unit tests, pass cleanly.

---

## 2. Models & Configurations Evaluated

| Model Class | Configurations Tested | Target Transform | Scaling Applied |
| :--- | :--- | :---: | :---: |
| **Baselines** | Dummy (Mean), Dummy (Median), City Median | Raw INR | None |
| **Linear Models** | OLS, RidgeCV ($\alpha \in [10^{-2}, 10^3]$), LassoCV (3-fold) | Raw & Log1p | Within-Fold StandardScaler |
| **Random Forest** | $n=150$, `max_depth=15`, `min_samples_leaf=2` | Raw, Log (Naive), Log (Smear) | None |
| **Gradient Boosting** | $n=150$, `max_depth=4`, `learning_rate=0.08` | Raw, Log (Naive), Log (Smear) | None |
| **XGBoost** | $n=150$, `max_depth=5`, `learning_rate=0.08`, `subsample=0.85` | Raw, Log (Naive), Log (Smear) | None |

---

## 3. Audited 5-Fold Cross-Validation Benchmark Results

All metrics reported in INR currency units on out-of-fold predictions on 3,776 training samples:

| Model | MAE (INR) | RMSE (INR) | R² Score | MedAE (INR) | MAPE (%) | Acc ≤ 20% | Mean Bias (INR) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Baseline: Dummy Mean | ₹30,387.11 | ₹61,708.34 | -0.0007 | ₹21,918.30 | 171.03% | 9.75% | +₹0.16 |
| Baseline: Dummy Median | ₹24,329.27 | ₹64,378.11 | -0.0891 | ₹8,000.00 | 65.36% | 21.77% | +₹18,416.68 |
| Baseline: City Median | ₹20,704.39 | ₹58,136.90 | 0.1118 | ₹6,275.00 | 56.85% | 27.04% | +₹12,596.86 |
| Linear Regression (Raw) | ₹19,363.90 | ₹42,284.79 | 0.5301 | ₹10,116.85 | 81.13% | 16.29% | -₹2,392.82 |
| Linear Regression (Log) | ₹12,291.78 | ₹36,058.71 | 0.6583 | ₹3,883.89 | 33.73% | 42.61% | +₹3,050.15 |
| Ridge Regression (Log) | ₹12,285.71 | ₹36,023.39 | 0.6590 | ₹3,905.73 | 33.71% | 42.64% | +₹3,123.93 |
| Lasso Regression (Log) | ₹12,234.65 | ₹35,900.97 | 0.6613 | ₹3,914.07 | 33.66% | 42.56% | +₹3,263.00 |
| Random Forest (Raw) | ₹11,721.25 | ₹31,204.96 | 0.7441 | ₹4,059.45 | 38.30% | 41.05% | -₹302.61 |
| Random Forest (Log, Naive) | ₹11,161.44 | ₹33,016.70 | 0.7135 | ₹3,758.94 | 32.15% | 44.17% | +₹3,141.97 |
| Random Forest (Log, Smear)| ₹11,203.10 | ₹32,780.48 | 0.7176 | ₹3,864.75 | 33.23% | 42.98% | +₹2,250.67 |
| Gradient Boosting (Raw) | ₹11,908.40 | ₹32,188.87 | 0.7277 | ₹4,228.10 | 38.93% | 40.94% | -₹71.33 |
| **Gradient Boosting (Log, Naive)** | **₹10,955.43** | ₹32,444.91 | 0.7234 | **₹3,671.46** | **31.59%** | 43.80% | +₹3,015.65 |
| Gradient Boosting (Log, Smear) | ₹11,201.26 | ₹32,054.01 | 0.7300 | ₹3,934.58 | 34.17% | 42.24% | +₹1,105.14 |
| XGBoost (Log, Naive) | ₹11,151.46 | ₹32,816.59 | 0.7170 | ₹3,706.53 | 31.64% | 43.06% | +₹3,066.00 |
| XGBoost (Log, Smear) | ₹11,304.47 | ₹32,425.04 | 0.7237 | ₹3,930.68 | 33.66% | 41.90% | +₹1,526.28 |

---

## 4. Final Held-Out Test Evaluation (944 Samples)

Following cross-validation, the selected model pipeline was fitted on all 3,776 training samples and evaluated **strictly once** on the held-out test partition:

| Metric | Dummy Median | City Median | Final Selected Model (GBDT) | Absolute Improvement vs City Median |
| :--- | :---: | :---: | :---: | :---: |
| **MAE (INR)** | ₹23,317.80 | ₹19,666.85 | **₹10,589.90** | **-₹9,076.95 (46.2% error reduction)** |
| **MedAE (INR)** | ₹8,000.00 | ₹6,500.00 | **₹3,728.91** | **-₹2,771.09 (42.6% error reduction)** |
| **RMSE (INR)** | ₹54,390.15 | ₹47,437.03 | **₹28,181.80** | **-₹19,255.23 (40.6% error reduction)** |
| **R² Score** | -0.1181 | 0.1495 | **0.6998** | **+0.5503** |
| **MAPE (%)** | 63.40% | 55.55% | **30.64%** | **-24.91 percentage points** |
| **Accuracy ≤ 20%** | 20.97% | 24.47% | **46.08%** | **+21.61 percentage points** |
| **Accuracy ≤ 10%** | 10.38% | 12.08% | **25.00%** | **+12.92 percentage points** |
| **Accuracy ≤ 30%** | 31.89% | 36.65% | **64.30%** | **+27.65 percentage points** |

---

## 5. Segment Slice Performance

- **Geographic Metros:** 
  - Hyderabad achieved highest accuracy: MAE = ₹4,145.30, MAPE = 24.86%, R² = 0.9056.
  - Bangalore: MAE = ₹5,862.62, MAPE = 28.56%, R² = 0.6329.
  - Chennai: MAE = ₹7,254.70, MAPE = 30.59%, R² = 0.5359.
  - Kolkata: MAE = ₹5,112.05, MAPE = 29.12%, R² = 0.0882 (narrow price variance).
  - Mumbai: MAE = ₹23,777.01, MAPE = 32.66%, R² = 0.6780 (reflects high base rents: median ₹50k vs ₹14k elsewhere).
  - Delhi: MAE = ₹15,307.78, MAPE = 40.31%, R² = 0.2627.
- **Unit Configuration (BHK):**
  - 1 BHK (228 listings): MAE = ₹4,433.45, MedAE = ₹2,104.98, MAPE = 30.67%.
  - 2 BHK (441 listings): MAE = ₹6,535.11, MedAE = ₹3,162.09, MAPE = 27.55% (largest volume segment).
  - 3 BHK (234 listings): MAE = ₹15,040.51, MedAE = ₹7,805.30, MAPE = 33.61%.
  - 4 BHK (34 listings): MAE = ₹53,364.07, MedAE = ₹31,620.29, MAPE = 48.46%.
- **Price Tiers:**
  - Budget (< ₹20k): 526 units, MAE = ₹3,307.13, MedAE = ₹2,114.99.
  - Mid-Tier (₹20k - ₹50k): 282 units, MAE = ₹8,273.68, MedAE = ₹7,188.39.
  - Premium (₹50k - ₹1.5L): 101 units, MAE = ₹23,835.96, MedAE = ₹19,478.16.
  - Luxury (> ₹1.5L): 35 units, MAE = ₹100,477.32, MedAE = ₹69,874.23.

---

## 6. Verification and Regression Suite

1. **ML Pipeline Tests (`ml/tests/test_model.py`):**
   - 8 unit and integrity tests covering pipeline deserialization, deterministic outputs, non-negative clamping, economic rent ceiling bounds, missing floor imputation, unknown category fallback, and metric computation.
   - **Result: 8 / 8 tests PASS.**
2. **Existing Full Stack Regression Suite:**
   - `backend/test_auth.js`: 29 / 29 PASS.
   - `backend/test_phase2.js`: 70 / 70 PASS.
   - `frontend/test_frontend_integration.js`: 15 / 15 PASS.
   - `frontend/test_frontend_crud.js`: 44 / 44 PASS.
   - **Result: 158 / 158 tests PASS.**

---

## 7. Artifacts & Git Status

### New Untracked Artifacts in Phase 5C:
- `docs/ML_MODEL_EVALUATION_REPORT.md`
- `docs/PHASE_5C_COMPLETION_REPORT.md`
- `ml/src/pipeline.py` (Serializable production pipeline)
- `ml/src/train.py` (Production training & test evaluation script)
- `ml/src/benchmark_cv.py` (Leak-free 5-fold CV benchmarking script)
- `ml/src/evaluate.py` (Evaluation metrics and slice analysis)
- `ml/src/generate_notebook_02.py`
- `ml/notebooks/02_model_training_and_evaluation.ipynb`
- `ml/tests/test_model.py`
- `ml/models/cv_benchmark_results.csv`
- `ml/models/model_metadata.json`

### Git Protection & Ignored Artifacts:
- `ml/models/rental_price_model.joblib` (Ignored by `.gitignore`)
- `ml/data/raw/*` and `ml/data/processed/*` (Ignored by `.gitignore`)
- Git working tree: **0 staged files, 0 commits, 0 pushes.**

---

## 8. Explicit Boundaries Preserved

- No FastAPI code or server written.
- No modifications made to Express backend or React frontend.
- No dataset files, raw CSVs, or credentials staged or committed.
- No commits or pushes performed.

**Awaiting user authorization before Phase 5D (Model Serving & Integration).**
