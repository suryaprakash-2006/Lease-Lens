"""LeaseLens — Model Evaluation & Diagnostic Module
Path: ml/src/evaluate.py

Provides standardized evaluation metrics, segment-based slice analysis,
residual diagnostics, and model comparison reporting in INR context.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    median_absolute_error,
)


def inverse_transform_log_predictions(
    y_log_pred: np.ndarray,
    train_residuals_log: Optional[np.ndarray] = None,
    method: str = "naive",
    ceiling_inr: float = 2000000.0,
) -> np.ndarray:
    """Invert log1p predictions back to INR scale with explicit retransformation handling.

    Background on Retransformation Bias:
    When predicting z = log(1 + y), a regression model trained on MSE or MAE estimates
    E[z | X] (or Median[z | X]). By Jensen's Inequality:
        E[exp(z)] >= exp(E[z])
    Specifically, if z | X ~ N(mu, sigma^2), then E[1 + y | X] = exp(mu + sigma^2 / 2).
    Consequently:
    1. 'naive' method: exp(z_hat) - 1 estimates the CONDITIONAL MEDIAN of rent.
       The conditional median is the theoretical minimizer of MAE (Mean Absolute Error).
       However, it produces a downward bias for predicting the expected mean rent.
    2. 'smearing' method (Duan's Smearing Estimator, Duan 1983):
       Non-parametric correction factor: s = (1/N) * sum(exp(e_i)), where e_i are log-scale residuals.
       y_hat = s * exp(z_hat) - 1. Unbiased estimator of conditional mean without normality assumption.
    3. 'lognormal' method:
       Analytical correction factor: c = exp(sigma^2 / 2).
       y_hat = c * exp(z_hat) - 1.

    Predictions are clipped to [0.0, ceiling_inr] for financial safety.
    """
    y_log_pred = np.asarray(y_log_pred, dtype=float)

    if method == "naive" or train_residuals_log is None:
        y_inr = np.expm1(y_log_pred)
    elif method == "smearing":
        smear_factor = float(np.mean(np.exp(train_residuals_log)))
        y_inr = smear_factor * np.exp(y_log_pred) - 1.0
    elif method == "lognormal":
        sigma_sq = float(np.var(train_residuals_log))
        correction = np.exp(sigma_sq / 2.0)
        y_inr = correction * np.exp(y_log_pred) - 1.0
    else:
        raise ValueError(f"Unknown retransformation method: {method}")

    # Financial domain clipping: non-negative and bounded by economic ceiling
    return np.clip(y_inr, 0.0, ceiling_inr)


def compute_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    model_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Compute comprehensive regression metrics in INR monetary context.

    Enforces non-negative rental predictions (clips at 0).

    Metrics:
    - MAE: Mean Absolute Error in INR
    - RMSE: Root Mean Squared Error in INR
    - R2: Coefficient of Determination
    - MedAE: Median Absolute Error in INR
    - MAPE: Mean Absolute Percentage Error (%)
    - within_10_pct: Fraction of predictions within +/-10% of true rent
    - within_20_pct: Fraction of predictions within +/-20% of true rent
    - within_30_pct: Fraction of predictions within +/-30% of true rent
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.clip(np.asarray(y_pred, dtype=float), 0.0, None)

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    medae = float(median_absolute_error(y_true, y_pred))

    # Percentage error guards against zero true values
    safe_mask = y_true > 0
    if np.any(safe_mask):
        ape = np.abs((y_true[safe_mask] - y_pred[safe_mask]) / y_true[safe_mask]) * 100.0
        mape = float(np.mean(ape))
        within_10 = float(np.mean(ape <= 10.0)) * 100.0
        within_20 = float(np.mean(ape <= 20.0)) * 100.0
        within_30 = float(np.mean(ape <= 30.0)) * 100.0
    else:
        mape = np.nan
        within_10 = np.nan
        within_20 = np.nan
        within_30 = np.nan

    # Residuals
    residuals = y_true - y_pred
    mean_residual = float(np.mean(residuals))

    res = {
        "model_name": model_name or "Model",
        "sample_count": int(len(y_true)),
        "mae_inr": round(mae, 2),
        "rmse_inr": round(rmse, 2),
        "r2_score": round(r2, 4),
        "medae_inr": round(medae, 2),
        "mape_percent": round(mape, 2),
        "accuracy_within_10pct": round(within_10, 2),
        "accuracy_within_20pct": round(within_20, 2),
        "accuracy_within_30pct": round(within_30, 2),
        "mean_residual_bias_inr": round(mean_residual, 2),
        "max_underprediction_inr": round(float(np.max(residuals)), 2),
        "max_overprediction_inr": round(float(np.abs(np.min(residuals))), 2),
    }
    return res


def evaluate_segment_slices(
    raw_df: pd.DataFrame,
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, pd.DataFrame]:
    """Perform slice analysis across key property attributes: City, BHK, and Rent Tier.

    Returns DataFrames of sliced metrics with sample size, MAE, RMSE, R², and MedAE.
    """
    df_eval = raw_df.copy().reset_index(drop=True)
    df_eval["y_true"] = np.asarray(y_true)
    df_eval["y_pred"] = np.clip(np.asarray(y_pred), 0.0, None)
    df_eval["abs_error"] = np.abs(df_eval["y_true"] - df_eval["y_pred"])
    df_eval["pct_error"] = (df_eval["abs_error"] / df_eval["y_true"]) * 100.0

    # Define rent tiers
    def categorize_tier(rent: float) -> str:
        if rent < 20000:
            return "1. Budget (< 20k INR)"
        elif rent <= 50000:
            return "2. Mid-Tier (20k - 50k INR)"
        elif rent <= 150000:
            return "3. Premium (50k - 1.5L INR)"
        else:
            return "4. Luxury (> 1.5L INR)"

    df_eval["Rent_Tier"] = df_eval["y_true"].apply(categorize_tier)

    slices = {}

    # Slice 1: City
    city_rows = []
    for city, grp in df_eval.groupby("City"):
        if len(grp) >= 10:
            city_rows.append({
                "Segment": city,
                "Count": len(grp),
                "Median_Actual_INR": round(float(grp["y_true"].median()), 0),
                "MAE_INR": round(float(mean_absolute_error(grp["y_true"], grp["y_pred"])), 2),
                "RMSE_INR": round(float(root_mean_squared_error(grp["y_true"], grp["y_pred"])), 2),
                "R2": round(float(r2_score(grp["y_true"], grp["y_pred"])), 4),
                "MedAE_INR": round(float(median_absolute_error(grp["y_true"], grp["y_pred"])), 2),
                "MAPE_%": round(float(grp["pct_error"].mean()), 2),
            })
    slices["City"] = pd.DataFrame(city_rows).sort_values("Count", ascending=False)

    # Slice 2: BHK
    bhk_rows = []
    for bhk, grp in df_eval.groupby("BHK"):
        if len(grp) >= 10:
            bhk_rows.append({
                "Segment": f"{bhk} BHK",
                "Count": len(grp),
                "Median_Actual_INR": round(float(grp["y_true"].median()), 0),
                "MAE_INR": round(float(mean_absolute_error(grp["y_true"], grp["y_pred"])), 2),
                "RMSE_INR": round(float(root_mean_squared_error(grp["y_true"], grp["y_pred"])), 2),
                "R2": round(float(r2_score(grp["y_true"], grp["y_pred"])), 4),
                "MedAE_INR": round(float(median_absolute_error(grp["y_true"], grp["y_pred"])), 2),
                "MAPE_%": round(float(grp["pct_error"].mean()), 2),
            })
    slices["BHK"] = pd.DataFrame(bhk_rows).sort_values("Segment")

    # Slice 3: Rent Tier
    tier_rows = []
    for tier, grp in df_eval.groupby("Rent_Tier"):
        if len(grp) >= 5:
            tier_rows.append({
                "Segment": tier,
                "Count": len(grp),
                "Median_Actual_INR": round(float(grp["y_true"].median()), 0),
                "MAE_INR": round(float(mean_absolute_error(grp["y_true"], grp["y_pred"])), 2),
                "RMSE_INR": round(float(root_mean_squared_error(grp["y_true"], grp["y_pred"])), 2),
                "R2": round(float(r2_score(grp["y_true"], grp["y_pred"])), 4) if len(grp) > 1 else np.nan,
                "MedAE_INR": round(float(median_absolute_error(grp["y_true"], grp["y_pred"])), 2),
                "MAPE_%": round(float(grp["pct_error"].mean()), 2),
            })
    slices["Rent_Tier"] = pd.DataFrame(tier_rows).sort_values("Segment")

    return slices
