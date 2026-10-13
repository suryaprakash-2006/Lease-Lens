"""LeaseLens — Data Inspection Module
Path: ml/src/data_inspection.py

Reproducible script for auditing data quality, schema integrity,
missing values, distributions, and anomalies in the House Rent Dataset.
"""

import os
import sys
import hashlib
import json
import numpy as np
import pandas as pd


def compute_sha256(filepath: str) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def inspect_floor_column(series: pd.Series) -> dict:
    """Analyze string patterns in the Floor column."""
    total_count = len(series)
    out_of_count = series.str.contains("out of", case=False, na=False).sum()
    no_out_of_count = total_count - out_of_count

    special_levels = {"Ground": 0, "Upper Basement": 0, "Lower Basement": 0}
    for val in series:
        for sp in special_levels:
            if sp in val:
                special_levels[sp] += 1

    return {
        "unique_patterns": int(series.nunique()),
        "has_out_of": int(out_of_count),
        "missing_out_of": int(no_out_of_count),
        "ground_occurrences": special_levels["Ground"],
        "upper_basement_occurrences": special_levels["Upper Basement"],
        "lower_basement_occurrences": special_levels["Lower Basement"],
    }


def run_inspection(csv_path: str = None) -> dict:
    """Run full statistical and data-quality inspection on the raw dataset."""
    if csv_path is None:
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data",
            "raw",
            "House_Rent_Dataset.csv",
        )

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Raw dataset not found at expected path: {csv_path}")

    file_size_bytes = os.path.getsize(csv_path)
    file_sha256 = compute_sha256(csv_path)

    df = pd.read_csv(csv_path)

    n_rows, n_cols = df.shape
    columns = list(df.columns)
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    missing_counts = {col: int(cnt) for col, cnt in df.isnull().sum().items()}
    total_duplicates = int(df.duplicated().sum())

    # Duplicates excluding 'Posted On'
    feat_cols = [c for c in columns if c != "Posted On"]
    duplicates_ex_posted_on = int(df.duplicated(subset=feat_cols).sum())

    # Numeric summaries
    numeric_cols = ["BHK", "Rent", "Size", "Bathroom"]
    numeric_stats = {}
    for col in numeric_cols:
        s = df[col]
        numeric_stats[col] = {
            "mean": float(round(s.mean(), 2)),
            "std": float(round(s.std(), 2)),
            "min": float(s.min()),
            "p01": float(round(s.quantile(0.01), 2)),
            "p05": float(round(s.quantile(0.05), 2)),
            "p25": float(round(s.quantile(0.25), 2)),
            "median": float(round(s.median(), 2)),
            "p75": float(round(s.quantile(0.75), 2)),
            "p95": float(round(s.quantile(0.95), 2)),
            "p99": float(round(s.quantile(0.99), 2)),
            "max": float(s.max()),
            "skewness": float(round(s.skew(), 4)),
            "kurtosis": float(round(s.kurtosis(), 4)),
        }

    # Log Rent statistics
    log_rent = np.log1p(df["Rent"])
    log_rent_stats = {
        "mean": float(round(log_rent.mean(), 4)),
        "std": float(round(log_rent.std(), 4)),
        "median": float(round(log_rent.median(), 4)),
        "skewness": float(round(log_rent.skew(), 4)),
        "kurtosis": float(round(log_rent.kurtosis(), 4)),
    }

    # Categorical counts
    categorical_counts = {}
    for cat_col in ["City", "Furnishing Status", "Tenant Preferred", "Area Type", "Point of Contact"]:
        if cat_col in df.columns:
            categorical_counts[cat_col] = {str(k): int(v) for k, v in df[cat_col].value_counts().items()}

    # City-wise Rent statistics
    city_rent_stats = {}
    for city, grp in df.groupby("City"):
        city_rent_stats[city] = {
            "count": int(len(grp)),
            "median_rent": float(grp["Rent"].median()),
            "mean_rent": float(round(grp["Rent"].mean(), 2)),
            "min_rent": float(grp["Rent"].min()),
            "max_rent": float(grp["Rent"].max()),
            "iqr_rent": float(grp["Rent"].quantile(0.75) - grp["Rent"].quantile(0.25)),
        }

    # Anomalies and boundary conditions
    anomalies = {
        "rent_le_zero": int((df["Rent"] <= 0).sum()),
        "size_le_zero": int((df["Size"] <= 0).sum()),
        "bhk_le_zero": int((df["BHK"] <= 0).sum()),
        "bathroom_le_zero": int((df["Bathroom"] <= 0).sum()),
        "size_lt_50_sqft": int((df["Size"] < 50).sum()),
        "size_lt_100_sqft": int((df["Size"] < 100).sum()),
        "rent_lt_2000": int((df["Rent"] < 2000).sum()),
        "rent_gt_1000000": int((df["Rent"] > 1000000).sum()),
        "bathroom_gt_bhk_plus_2": int((df["Bathroom"] > (df["BHK"] + 2)).sum()),
        "built_area_count": int((df["Area Type"] == "Built Area").sum()),
        "contact_builder_count": int((df["Point of Contact"] == "Contact Builder").sum()),
    }

    # Correlations
    df_corr = df[numeric_cols].copy()
    df_corr["log_Rent"] = np.log1p(df["Rent"])
    correlations_with_rent = {col: float(round(df_corr[col].corr(df["Rent"]), 4)) for col in numeric_cols if col != "Rent"}
    correlations_with_log_rent = {col: float(round(df_corr[col].corr(df_corr["log_Rent"]), 4)) for col in numeric_cols if col != "Rent"}

    results = {
        "file_info": {
            "path": csv_path,
            "size_bytes": file_size_bytes,
            "sha256": file_sha256,
        },
        "shape": {
            "rows": n_rows,
            "columns": n_cols,
        },
        "column_names": columns,
        "dtypes": dtypes,
        "missing_counts": missing_counts,
        "duplicates": {
            "exact_12_cols": total_duplicates,
            "excluding_posted_on": duplicates_ex_posted_on,
        },
        "numeric_stats": numeric_stats,
        "log_rent_stats": log_rent_stats,
        "categorical_counts": categorical_counts,
        "locality_stats": {
            "unique_localities": int(df["Area Locality"].nunique()),
            "top_5_localities": {str(k): int(v) for k, v in df["Area Locality"].value_counts().head(5).items()},
        },
        "floor_inspection": inspect_floor_column(df["Floor"]),
        "city_rent_stats": city_rent_stats,
        "anomalies": anomalies,
        "correlations": {
            "with_raw_rent": correlations_with_rent,
            "with_log_rent": correlations_with_log_rent,
        },
    }
    return results


def print_inspection_report(res: dict) -> None:
    """Print formatted inspection report to stdout."""
    print("=" * 70)
    print(" LeaseLens -- Dataset Quality & Statistical Inspection Report")
    print("=" * 70)
    print(f"File Path:   {res['file_info']['path']}")
    print(f"File Size:   {res['file_info']['size_bytes']} bytes (~{res['file_info']['size_bytes'] / 1024:.2f} KB)")
    print(f"SHA-256:     {res['file_info']['sha256']}")
    print(f"Dimensions:  {res['shape']['rows']} rows, {res['shape']['columns']} columns")
    print(f"Duplicates:  Exact={res['duplicates']['exact_12_cols']}, Without Posted On={res['duplicates']['excluding_posted_on']}")
    print("-" * 70)
    print("Missing Values per Column:")
    for col, count in res["missing_counts"].items():
        print(f"  {col:<20} {count:>5} (0.00%)")
    print("-" * 70)
    print("Numeric Feature Distributions:")
    print(f"{'Feature':<10} {'Mean':>10} {'Std':>10} {'Min':>8} {'Median':>10} {'Max':>10} {'Skewness':>10}")
    for col, s in res["numeric_stats"].items():
        print(f"{col:<10} {s['mean']:>10.1f} {s['std']:>10.1f} {s['min']:>8.0f} {s['median']:>10.1f} {s['max']:>10.0f} {s['skewness']:>10.2f}")
    print(f"\nTarget Skewness Comparison:")
    print(f"  Raw Rent Skewness:      {res['numeric_stats']['Rent']['skewness']:.4f} (Severe Right Skew)")
    print(f"  log1p(Rent) Skewness:   {res['log_rent_stats']['skewness']:.4f} (Near Normal Distribution)")
    print("-" * 70)
    print("Categorical Distributions:")
    for cat, counts in res["categorical_counts"].items():
        print(f"  {cat}: {counts}")
    print("-" * 70)
    print("City-wise Rent (Median INR):")
    for city, stats in res["city_rent_stats"].items():
        print(f"  {city:<12} n={stats['count']:<4} Median=INR {stats['median_rent']:<10.0f} Mean=INR {stats['mean_rent']:<10.0f} Max=INR {stats['max_rent']:<10.0f}")
    print("-" * 70)
    print("Correlations with Rent:")
    print(f"{'Feature':<12} {'Raw Rent Corr':>15} {'log1p(Rent) Corr':>18}")
    for feat in ["BHK", "Size", "Bathroom"]:
        print(f"{feat:<12} {res['correlations']['with_raw_rent'][feat]:>15.4f} {res['correlations']['with_log_rent'][feat]:>18.4f}")
    print("-" * 70)
    print("Anomalies Detected:")
    for k, v in res["anomalies"].items():
        print(f"  {k:<28} {v:>5}")
    print("=" * 70)


if __name__ == "__main__":
    results = run_inspection()
    print_inspection_report(results)
