"""LeaseLens — Production Model Training & Held-Out Evaluation Pipeline
Path: ml/src/train.py

Objective:
1. Fit the complete preprocessing pipeline strictly on the 3,776-sample training partition.
2. Train the winning model selected via 5-fold cross-validation:
   GradientBoostingRegressor(n_estimators=150, max_depth=4, learning_rate=0.08, random_state=42)
   on log1p(Rent) target.
3. Compute training residual statistics and Duan's smearing factor for retransformation bias correction.
4. Evaluate EXACTLY ONCE on the held-out test partition (test.csv, 944 rows) kept untouched during model selection.
5. Generate comprehensive INR-scale performance metrics and property slice analysis (City, BHK, Rent Tier).
6. Persist trained model artifact and metadata to ml/models/.
"""

import os
import sys
import json
import logging
from typing import Dict, Any

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score, median_absolute_error

# Add ml/src directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from preprocessing import RentalPreprocessor
from pipeline import LeaseLensModelPipeline
from evaluate import compute_regression_metrics, inverse_transform_log_predictions, evaluate_segment_slices

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("leaselens.train")


def train_and_evaluate():
    base_dir = os.path.dirname(current_dir)
    train_path = os.path.join(base_dir, "data", "processed", "train.csv")
    test_path = os.path.join(base_dir, "data", "processed", "test.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    logger.info("Loading training and held-out test partitions...")
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    logger.info("Training set: %d rows | Held-out test set: %d rows", len(train_df), len(test_df))

    # 1. Fit Complete Pipeline on Training Partition
    preprocessor = RentalPreprocessor()
    gb_model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.08,
        random_state=42,
    )
    pipeline = LeaseLensModelPipeline(preprocessor, gb_model, retransformation_method="naive")
    logger.info("Fitting LeaseLensModelPipeline on 3,776 training samples...")
    pipeline.fit(train_df)
    logger.info("Training complete. Smear factor: %.4f, Log residual variance: %.4f",
                pipeline.smear_factor_, pipeline.log_residual_var_)

    # 2. In-sample Training Performance (for Overfitting / Bias Check)
    y_train_true = train_df["Rent"].values
    y_train_pred_naive = pipeline.predict(train_df, method="naive")
    y_train_pred_smear = pipeline.predict(train_df, method="smearing")
    train_metrics_naive = compute_regression_metrics(y_train_true, y_train_pred_naive, "Selected Model: GBDT (Train, Naive)")
    train_metrics_smear = compute_regression_metrics(y_train_true, y_train_pred_smear, "Selected Model: GBDT (Train, Smearing)")

    # 3. Final Held-Out Test Evaluation (Evaluated ONCE)
    y_test_true = test_df["Rent"].values
    y_test_pred_naive = pipeline.predict(test_df, method="naive")
    y_test_pred_smear = pipeline.predict(test_df, method="smearing")

    test_metrics_naive = compute_regression_metrics(y_test_true, y_test_pred_naive, "Final Selected Model: GBDT (Test, Naive)")
    test_metrics_smear = compute_regression_metrics(y_test_true, y_test_pred_smear, "Final Selected Model: GBDT (Test, Smearing)")

    # Baseline comparison on Test Set
    from sklearn.dummy import DummyRegressor
    dummy_median = DummyRegressor(strategy="median")
    dummy_median.fit(train_df[["BHK"]], train_df["Rent"])
    dummy_preds = dummy_median.predict(test_df[["BHK"]])
    test_dummy_metrics = compute_regression_metrics(y_test_true, dummy_preds, "Baseline: Dummy Median (Test)")

    city_medians = train_df.groupby("City")["Rent"].median().to_dict()
    global_median = float(train_df["Rent"].median())
    city_base_preds = np.array([city_medians.get(c, global_median) for c in test_df["City"]])
    test_city_base_metrics = compute_regression_metrics(y_test_true, city_base_preds, "Baseline: City Median (Test)")

    # Print Comparison Table
    print("\n" + "=" * 105)
    print("FINAL HELD-OUT TEST EVALUATION RESULTS (944 SAMPLES)")
    print("=" * 105)
    test_summary_df = pd.DataFrame([
        test_dummy_metrics,
        test_city_base_metrics,
        test_metrics_naive,
        test_metrics_smear,
    ])
    cols = ["model_name", "mae_inr", "rmse_inr", "r2_score", "medae_inr", "mape_percent", "accuracy_within_20pct", "mean_residual_bias_inr"]
    print(test_summary_df[cols].to_string(index=False))
    print("=" * 105)

    # 4. Property Segment Slices on Test Set
    print("\n" + "=" * 90)
    print("TEST SET SLICE PERFORMANCE (CITY SEGMENTS)")
    print("=" * 90)
    slices_naive = evaluate_segment_slices(test_df, y_test_true, y_test_pred_naive)
    print(slices_naive["City"].to_string(index=False))

    print("\n" + "=" * 90)
    print("TEST SET SLICE PERFORMANCE (BHK SEGMENTS)")
    print("=" * 90)
    print(slices_naive["BHK"].to_string(index=False))

    print("\n" + "=" * 90)
    print("TEST SET SLICE PERFORMANCE (RENT TIER SEGMENTS)")
    print("=" * 90)
    print(slices_naive["Rent_Tier"].to_string(index=False))

    # 5. Persist Model and Metadata
    model_path = os.path.join(models_dir, "rental_price_model.joblib")
    joblib.dump(pipeline, model_path)
    logger.info("Saved complete pipeline artifact to %s", model_path)

    # Feature importances
    feat_names = pipeline.preprocessor.feature_names
    feat_importances = sorted(
        zip(feat_names, [round(float(v), 5) for v in gb_model.feature_importances_]),
        key=lambda x: x[1],
        reverse=True
    )

    metadata = {
        "model_type": "GradientBoostingRegressor",
        "target": "log1p(Rent)",
        "target_units": "INR",
        "hyperparameters": {
            "n_estimators": 150,
            "max_depth": 4,
            "learning_rate": 0.08,
            "random_state": 42,
        },
        "training_samples": len(train_df),
        "test_samples": len(test_df),
        "smear_factor": pipeline.smear_factor_,
        "log_residual_variance": pipeline.log_residual_var_,
        "feature_importances": feat_importances,
        "metrics": {
            "cv_5fold": {
                "mae_inr": 10955.43,
                "rmse_inr": 32444.91,
                "r2_score": 0.7234,
                "medae_inr": 3671.46,
                "mape_percent": 31.59,
                "accuracy_within_20pct": 43.80,
            },
            "test_held_out_naive": test_metrics_naive,
            "test_held_out_smear": test_metrics_smear,
            "test_baseline_city_median": test_city_base_metrics,
            "test_baseline_dummy_median": test_dummy_metrics,
        },
        "slice_performance": {
            "city": slices_naive["City"].to_dict(orient="records"),
            "bhk": slices_naive["BHK"].to_dict(orient="records"),
            "rent_tier": slices_naive["Rent_Tier"].to_dict(orient="records"),
        },
        "feature_names": feat_names,
    }

    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info("Saved evaluation metadata to %s", metadata_path)

    return metadata


if __name__ == "__main__":
    train_and_evaluate()
