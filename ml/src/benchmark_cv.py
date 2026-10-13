"""LeaseLens — Leak-Free Benchmark Cross-Validation Script
Path: ml/src/benchmark_cv.py

Methodological Rigor:
1. Zero Data Leakage: RentalPreprocessor is fitted independently INSIDE each fold
   strictly on the training split (approx 3,020 rows), never on all 3,776 rows.
2. Identical Folds: All models (baselines, raw-target, and log-target) are evaluated
   on the exact same 5-fold cross-validation partition (KFold, n_splits=5, shuffle=True, seed=42).
3. Fair INR Metrics: All models are evaluated in actual INR currency units
   (MAE, RMSE, R2, MedAE, MAPE, Accuracy +/-20%, Residual Bias).
4. Retransformation Analysis: Evaluates naive median inverse (expm1) and Duan's smearing
   correction to rigorously document retransformation bias.
5. Pristine Test Set: Held-out test set (test.csv, 944 rows) is untouched during model selection.
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression, RidgeCV, LassoCV
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor

# Add parent directory to sys.path to import local modules
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from preprocessing import RentalPreprocessor
from evaluate import compute_regression_metrics, inverse_transform_log_predictions


class CityMedianFoldBaseline:
    """Baseline predicting city-level median calculated strictly on fold training data."""
    def __init__(self):
        self.city_medians_ = {}
        self.global_median_ = 0.0

    def fit(self, train_df: pd.DataFrame):
        self.city_medians_ = train_df.groupby("City")["Rent"].median().to_dict()
        self.global_median_ = float(train_df["Rent"].median())
        return self

    def predict(self, val_df: pd.DataFrame) -> np.ndarray:
        return np.array([
            self.city_medians_.get(c, self.global_median_)
            for c in val_df["City"]
        ])


def run_leak_free_cv_benchmarks():
    base_dir = os.path.dirname(current_dir)
    train_path = os.path.join(base_dir, "data", "processed", "train.csv")

    if not os.path.exists(train_path):
        raise FileNotFoundError(f"Training data not found at {train_path}")

    train_df = pd.read_csv(train_path)
    n_samples = len(train_df)
    y_train_raw = train_df["Rent"].values

    print("=" * 80)
    print("LEASELENS — PHASE 5C: LEAK-FREE 5-FOLD CROSS-VALIDATION BENCHMARK")
    print(f"Training Samples: {n_samples:,} rows | Held-Out Test Set: UNTOUCHED")
    print("Preprocessing Policy: Fitted independently inside each fold (zero leakage)")
    print("=" * 80)

    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    splits = list(kf.split(train_df))

    # Pre-generate fold-specific preprocessed data to guarantee identical features across models
    fold_data = []
    print("\nFitting RentalPreprocessor independently inside each fold...")
    for fold_idx, (tr_idx, val_idx) in enumerate(splits, 1):
        tr_df = train_df.iloc[tr_idx].reset_index(drop=True)
        val_df = train_df.iloc[val_idx].reset_index(drop=True)

        prep = RentalPreprocessor()
        prep.fit(tr_df)

        X_tr, y_tr_raw, y_tr_log = prep.transform(tr_df)
        X_val, y_val_raw, y_val_log = prep.transform(val_df)

        # Standard scaler for linear models (fitted strictly on fold training data)
        scaler = StandardScaler()
        X_tr_scaled = pd.DataFrame(scaler.fit_transform(X_tr), columns=X_tr.columns)
        X_val_scaled = pd.DataFrame(scaler.transform(X_val), columns=X_val.columns)

        fold_data.append({
            "tr_df": tr_df,
            "val_df": val_df,
            "tr_idx": tr_idx,
            "val_idx": val_idx,
            "X_tr": X_tr,
            "X_val": X_val,
            "X_tr_scaled": X_tr_scaled,
            "X_val_scaled": X_val_scaled,
            "y_tr_raw": y_tr_raw.values,
            "y_val_raw": y_val_raw.values,
            "y_tr_log": y_tr_log.values,
            "y_val_log": y_val_log.values,
        })
        print(f"  Fold {fold_idx}: Train {len(tr_idx)} rows -> Val {len(val_idx)} rows (imputed medians: floor={prep.median_floor_number_}, total={prep.median_total_floors_})")

    results = []

    # -------------------------------------------------------------
    # 1. BASELINE MODELS
    # -------------------------------------------------------------
    # Baseline: Dummy Mean
    oof_preds = np.zeros(n_samples)
    for fd in fold_data:
        m = DummyRegressor(strategy="mean")
        m.fit(fd["X_tr"], fd["y_tr_raw"])
        oof_preds[fd["val_idx"]] = m.predict(fd["X_val"])
    results.append(compute_regression_metrics(train_df["Rent"].values, oof_preds, "Baseline: Dummy (Mean)"))

    # Baseline: Dummy Median
    oof_preds = np.zeros(n_samples)
    for fd in fold_data:
        m = DummyRegressor(strategy="median")
        m.fit(fd["X_tr"], fd["y_tr_raw"])
        oof_preds[fd["val_idx"]] = m.predict(fd["X_val"])
    results.append(compute_regression_metrics(train_df["Rent"].values, oof_preds, "Baseline: Dummy (Median)"))

    # Baseline: City Median
    oof_preds = np.zeros(n_samples)
    for fd in fold_data:
        city_base = CityMedianFoldBaseline()
        city_base.fit(fd["tr_df"])
        oof_preds[fd["val_idx"]] = city_base.predict(fd["val_df"])
    results.append(compute_regression_metrics(train_df["Rent"].values, oof_preds, "Baseline: City Median"))

    # -------------------------------------------------------------
    # 2. LINEAR REGRESSION MODELS (Scaled features)
    # -------------------------------------------------------------
    linear_specs = [
        ("Linear Regression (Raw Target)", LinearRegression(), False),
        ("Linear Regression (Log, Naive)", LinearRegression(), True),
        ("Ridge Regression (Raw Target)", RidgeCV(alphas=np.logspace(-2, 3, 20)), False),
        ("Ridge Regression (Log, Naive)", RidgeCV(alphas=np.logspace(-2, 3, 20)), True),
        ("Lasso Regression (Raw Target)", LassoCV(cv=3, random_state=42, max_iter=3000), False),
        ("Lasso Regression (Log, Naive)", LassoCV(cv=3, random_state=42, max_iter=3000), True),
    ]

    for name, model_proto, is_log in linear_specs:
        oof_preds = np.zeros(n_samples)
        for fd in fold_data:
            from sklearn.base import clone
            m = clone(model_proto)
            X_tr = fd["X_tr_scaled"]
            X_val = fd["X_val_scaled"]

            if is_log:
                m.fit(X_tr, fd["y_tr_log"])
                p_log = m.predict(X_val)
                oof_preds[fd["val_idx"]] = inverse_transform_log_predictions(p_log, method="naive")
            else:
                m.fit(X_tr, fd["y_tr_raw"])
                oof_preds[fd["val_idx"]] = np.clip(m.predict(X_val), 0.0, 2000000.0)
        results.append(compute_regression_metrics(train_df["Rent"].values, oof_preds, name))

    # -------------------------------------------------------------
    # 3. ENSEMBLE MODELS (Raw vs Log-Naive vs Log-Smearing)
    # -------------------------------------------------------------
    ensemble_specs = [
        ("Random Forest (Raw)", RandomForestRegressor(n_estimators=150, max_depth=15, min_samples_leaf=2, random_state=42, n_jobs=-1), False),
        ("Random Forest (Log, Naive)", RandomForestRegressor(n_estimators=150, max_depth=15, min_samples_leaf=2, random_state=42, n_jobs=-1), True),
        ("Random Forest (Log, Smearing)", RandomForestRegressor(n_estimators=150, max_depth=15, min_samples_leaf=2, random_state=42, n_jobs=-1), "smearing"),
        ("Gradient Boosting (Raw)", GradientBoostingRegressor(n_estimators=150, max_depth=4, learning_rate=0.08, random_state=42), False),
        ("Gradient Boosting (Log, Naive)", GradientBoostingRegressor(n_estimators=150, max_depth=4, learning_rate=0.08, random_state=42), True),
        ("Gradient Boosting (Log, Smearing)", GradientBoostingRegressor(n_estimators=150, max_depth=4, learning_rate=0.08, random_state=42), "smearing"),
        ("XGBoost (Raw)", XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.08, subsample=0.85, colsample_bytree=0.85, random_state=42, n_jobs=-1), False),
        ("XGBoost (Log, Naive)", XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.08, subsample=0.85, colsample_bytree=0.85, random_state=42, n_jobs=-1), True),
        ("XGBoost (Log, Smearing)", XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.08, subsample=0.85, colsample_bytree=0.85, random_state=42, n_jobs=-1), "smearing"),
    ]

    for name, model_proto, mode in ensemble_specs:
        oof_preds = np.zeros(n_samples)
        for fd in fold_data:
            from sklearn.base import clone
            m = clone(model_proto)
            X_tr = fd["X_tr"]
            X_val = fd["X_val"]

            if mode is False:
                # Raw target
                m.fit(X_tr, fd["y_tr_raw"])
                oof_preds[fd["val_idx"]] = np.clip(m.predict(X_val), 0.0, 2000000.0)
            elif mode is True:
                # Log target, naive median inverse
                m.fit(X_tr, fd["y_tr_log"])
                p_log = m.predict(X_val)
                oof_preds[fd["val_idx"]] = inverse_transform_log_predictions(p_log, method="naive")
            elif mode == "smearing":
                # Log target, Duan's smearing retransformation
                m.fit(X_tr, fd["y_tr_log"])
                train_res_log = fd["y_tr_log"] - m.predict(X_tr)
                p_log = m.predict(X_val)
                oof_preds[fd["val_idx"]] = inverse_transform_log_predictions(p_log, train_residuals_log=train_res_log, method="smearing")

        results.append(compute_regression_metrics(train_df["Rent"].values, oof_preds, name))

    df_res = pd.DataFrame(results)
    display_cols = [
        "model_name",
        "mae_inr",
        "rmse_inr",
        "r2_score",
        "medae_inr",
        "mape_percent",
        "accuracy_within_20pct",
        "mean_residual_bias_inr",
    ]
    print("\n" + "=" * 105)
    print("5-FOLD CROSS-VALIDATION BENCHMARK RESULTS (ALL INR-SCALE METRICS)")
    print("=" * 105)
    print(df_res[display_cols].to_string(index=False))
    print("=" * 105)

    # Save benchmark table
    out_table_path = os.path.join(base_dir, "models", "cv_benchmark_results.csv")
    os.makedirs(os.path.dirname(out_table_path), exist_ok=True)
    df_res.to_csv(out_table_path, index=False)
    print(f"\nSaved benchmark table to: {out_table_path}")

    return df_res


if __name__ == "__main__":
    run_leak_free_cv_benchmarks()
