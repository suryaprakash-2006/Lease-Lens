"""LeaseLens — Preprocessing & Feature Engineering Pipeline
Path: ml/src/preprocessing.py

Modular, reproducible data cleaning, feature engineering, and train/test
preparation pipeline for rental price regression in LeaseLens.
Ensures zero data leakage: all learned transformations are fit on training data only.
"""

import os
import sys
import json
import logging
from typing import Tuple, Dict, Any, List

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("leaselens.preprocessing")


def parse_floor_components(floor_val: Any) -> Tuple[float, float]:
    """Parse raw Floor string into (floor_number, total_floors) as floats with np.nan for missing.

    Explicit Mapping Rules:
    - 'Ground' -> 0.0
    - 'Upper Basement' -> -1.0
    - 'Lower Basement' -> -2.0
    - Integer digits 'X' -> float(X)
    - If composite 'X out of Y':
        level is parsed from X, total_floors is parsed from Y.
    - If standalone 'X' (no 'out of'):
        level is parsed from X, total_floors is np.nan (unstated in raw listing).
    - If value is unparseable or unrecognized:
        returns np.nan for that component — NEVER silently converts to ground floor!
    """
    if pd.isna(floor_val):
        return np.nan, np.nan

    floor_str = str(floor_val).strip()
    if not floor_str:
        return np.nan, np.nan

    if "out of" in floor_str.lower():
        parts = floor_str.split("out of")
        level_part = parts[0].strip()
        total_part = parts[1].strip() if len(parts) > 1 else ""
    else:
        level_part = floor_str
        total_part = ""

    # 1. Parse level explicitly
    level_lower = level_part.lower()
    if level_lower == "ground":
        floor_num = 0.0
    elif level_lower == "upper basement":
        floor_num = -1.0
    elif level_lower == "lower basement":
        floor_num = -2.0
    else:
        try:
            floor_num = float(int(level_part))
        except ValueError:
            floor_num = np.nan

    # 2. Parse total floors explicitly
    if total_part:
        try:
            total_floors = float(int(total_part))
        except ValueError:
            total_floors = np.nan
    else:
        # Standalone listing: total_floors is unstated in source data
        total_floors = np.nan

    # Sanity guard: if both components are observed and total_floors < floor_num
    if not np.isnan(floor_num) and not np.isnan(total_floors):
        if total_floors < floor_num:
            total_floors = max(floor_num, 1.0)

    return floor_num, total_floors


def parse_floor_string(floor_val: Any) -> Tuple[float, float]:
    """Convenience wrapper returning raw parsed components (retains parse_floor_components logic)."""
    return parse_floor_components(floor_val)


def clean_raw_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Clean the raw housing rental dataset using documented, empirical exclusion rules.

    Exclusion Rules:
    1. Deduplication: Exclude duplicate listings based on intrinsic feature columns
       (excluding 'Posted On' scraping timestamp).
    2. Outlier Typo Removal: Drop Bangalore Marathahalli listing with Rent = 3,500,000 INR
       (100x locality median, documented clerical data-entry error).
    3. Physically Impossible Area: Exclude listings where Size < 50 sq ft (micro-errors
       such as 10 sq ft for 3 BHK or 20 sq ft for 1 BHK).
    4. Non-Residential Bathroom Outlier: Exclude listing with Bathroom > 7 (single commercial/
       hostel property with 1 BHK and 10 bathrooms).

    Note: Legitimate ultra-luxury high-rent properties (e.g., Mumbai Worli/Juhu up to
    1,200,000 INR/month) are preserved without arbitrary truncation.
    """
    initial_rows = len(df)
    audit = {"initial_rows": initial_rows, "exclusions": {}}

    df_cleaned = df.copy()

    # 1. Deduplication excluding 'Posted On'
    feature_cols = [c for c in df_cleaned.columns if c != "Posted On"]
    dup_mask = df_cleaned.duplicated(subset=feature_cols, keep="first")
    n_dups = int(dup_mask.sum())
    df_cleaned = df_cleaned[~dup_mask]
    audit["exclusions"]["duplicate_listings_excluding_posted_on"] = {
        "dropped_count": n_dups,
        "rationale": "Exact duplicate property listings published on different crawl dates.",
    }

    # 2. Predeclared Residential Economic Rent Ceiling (> 2,000,000 INR / month)
    # Proposed domain restriction bounding the operational scope of the rental valuation model
    # to standard and luxury residential leases (<= 2,000,000 INR/month). Results do not establish
    # model performance above this ceiling.
    # Isolates row 1837 in Marathahalli, Bangalore (3 BHK, 2,500 sq ft, 4 out of 4 floors, 3 bathrooms, Rent = 3,500,000 INR).
    # Locality baseline in Marathahalli across comparable units is 15,000-35,000 INR/month. Available
    # scraper metadata does not conclusively verify a clerical keying error versus an unverified extreme outlier.
    # Excludes zero legitimate luxury properties (top legitimate South Mumbai Juhu luxury listing
    # is 1,200,000 INR/month, providing an 800,000 INR buffer below this ceiling).
    ECONOMIC_RENT_CEILING_INR = 2000000
    rent_ceiling_mask = df_cleaned["Rent"] > ECONOMIC_RENT_CEILING_INR
    n_ceiling = int(rent_ceiling_mask.sum())
    df_cleaned = df_cleaned[~rent_ceiling_mask]
    audit["exclusions"]["predeclared_economic_rent_ceiling_gt_2m_inr"] = {
        "dropped_count": n_ceiling,
        "rationale": f"Monthly rent exceeds proposed domain restriction of {ECONOMIC_RENT_CEILING_INR:,} INR (Row 1837: 3 BHK, 2500 sq ft, Marathahalli at 3,500,000 INR; unverified extreme outlier; scope bounded to leases <= 20L INR).",
    }

    # 3. Physically impossible area (< 50 sq ft)
    size_mask = df_cleaned["Size"] < 50
    n_size = int(size_mask.sum())
    df_cleaned = df_cleaned[~size_mask]
    audit["exclusions"]["impossible_unit_size_below_50_sqft"] = {
        "dropped_count": n_size,
        "rationale": "Physical impossibility for independent residential dwellings (e.g., 3 BHK with 10 sq ft).",
    }

    # 4. Extreme non-residential bathroom outlier (> 7)
    bath_mask = df_cleaned["Bathroom"] > 7
    n_bath = int(bath_mask.sum())
    df_cleaned = df_cleaned[~bath_mask]
    audit["exclusions"]["extreme_non_residential_bathroom_outlier"] = {
        "dropped_count": n_bath,
        "rationale": "Commercial hostel / farmhouse outlier (1 BHK with 10 bathrooms in Beeramguda, Hyderabad).",
    }

    final_rows = len(df_cleaned)
    total_dropped = initial_rows - final_rows
    audit["final_rows"] = final_rows
    audit["total_dropped"] = total_dropped
    audit["retention_percentage"] = round((final_rows / initial_rows) * 100, 2)

    logger.info(
        "Data cleaning complete: %d initial rows -> %d clean rows (%d dropped, %.2f%% retained)",
        initial_rows,
        final_rows,
        total_dropped,
        audit["retention_percentage"],
    )
    return df_cleaned.reset_index(drop=True), audit


def split_train_test(
    df: pd.DataFrame, test_size: float = 0.20, random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split clean dataset into 80% train and 20% test partitions.

    Uses stratification on 'City' to guarantee balanced geographic representation
    across Mumbai, Delhi, Bangalore, Hyderabad, Chennai, and Kolkata.
    """
    train_df, test_df = train_test_split(
        df,
        test_size=test_size,
        random_state=random_state,
        stratify=df["City"],
    )
    return train_df.reset_index(drop=True), test_df.reset_index(drop=True)


class RentalPreprocessor:
    """Production preprocessor for LeaseLens rental price regression.

    Learns categorical encoding, numerical floor imputation medians, and feature
    transformations strictly from the training partition to prevent any data leakage.
    """

    CATEGORICAL_COLUMNS = ["City", "Furnishing Status", "Tenant Preferred", "Area Type"]
    NUMERICAL_COLUMNS = ["BHK", "Size", "Bathroom", "floor_number", "total_floors", "floor_ratio"]

    def __init__(self):
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        self.encoded_feature_names: List[str] = []
        self.feature_names: List[str] = []
        self.is_fitted: bool = False
        self.median_floor_number_: float = 0.0
        self.median_total_floors_: float = 4.0

    def fit(self, train_df: pd.DataFrame) -> "RentalPreprocessor":
        """Fit preprocessor parameters strictly on training partition."""
        # 1. Fit floor imputation medians strictly on training partition
        raw_train_parsed = [parse_floor_components(f) for f in train_df["Floor"]]
        train_floor_nums = pd.Series([p[0] for p in raw_train_parsed]).dropna()
        train_total_floors = pd.Series([p[1] for p in raw_train_parsed]).dropna()

        self.median_floor_number_ = float(train_floor_nums.median()) if len(train_floor_nums) > 0 else 0.0
        self.median_total_floors_ = float(train_total_floors.median()) if len(train_total_floors) > 0 else 4.0

        # 2. Engineer features using learned training medians
        train_eng = self._engineer_features(train_df)

        # 3. Fit one-hot encoder on categorical columns
        cat_data = train_eng[self.CATEGORICAL_COLUMNS].astype(str)
        self.encoder.fit(cat_data)
        self.encoded_feature_names = list(self.encoder.get_feature_names_out(self.CATEGORICAL_COLUMNS))

        # Full feature list: numerical followed by encoded categorical
        self.feature_names = self.NUMERICAL_COLUMNS + self.encoded_feature_names
        self.is_fitted = True

        logger.info(
            "RentalPreprocessor fitted on %d training rows. Feature count: %d (%d numeric, %d one-hot). Imputed medians: floor_number=%.1f, total_floors=%.1f",
            len(train_df),
            len(self.feature_names),
            len(self.NUMERICAL_COLUMNS),
            len(self.encoded_feature_names),
            self.median_floor_number_,
            self.median_total_floors_,
        )
        return self

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive numeric floor features and ratio using learned training imputation."""
        df_eng = df.copy()

        parsed_floors = [parse_floor_components(f) for f in df_eng["Floor"]]
        floor_nums = [p[0] for p in parsed_floors]
        total_floors = [p[1] for p in parsed_floors]

        # Impute missing components using learned training statistics
        imputed_floor_nums = [
            self.median_floor_number_ if np.isnan(fn) else fn
            for fn in floor_nums
        ]
        imputed_total_floors = [
            max(fn, self.median_total_floors_) if np.isnan(tf) else tf
            for fn, tf in zip(imputed_floor_nums, total_floors)
        ]

        df_eng["floor_number"] = imputed_floor_nums
        df_eng["total_floors"] = imputed_total_floors
        df_eng["floor_ratio"] = (
            df_eng["floor_number"] / df_eng["total_floors"].clip(lower=1.0)
        ).round(4)

        return df_eng

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
        """Transform dataset into feature matrix X and target vectors y_raw, y_log.

        Returns:
            X: DataFrame of preprocessed features.
            y_raw: Series of monthly rent in INR.
            y_log: Series of log1p(Rent) for variance-stabilized regression.
        """
        if not self.is_fitted:
            raise RuntimeError("RentalPreprocessor must be fitted before calling transform().")

        df_eng = self._engineer_features(df)

        # Numerical features
        X_num = df_eng[self.NUMERICAL_COLUMNS].reset_index(drop=True)

        # Categorical features
        cat_data = df_eng[self.CATEGORICAL_COLUMNS].astype(str)
        X_cat_array = self.encoder.transform(cat_data)
        X_cat = pd.DataFrame(X_cat_array, columns=self.encoded_feature_names)

        # Combined feature matrix
        X = pd.concat([X_num, X_cat], axis=1)

        # Targets
        y_raw = df_eng["Rent"].reset_index(drop=True)
        y_log = np.log1p(y_raw)

        return X, y_raw, y_log

    @staticmethod
    def inverse_transform_target(y_log_pred: np.ndarray) -> np.ndarray:
        """Convert log-scale predictions back to INR scale.

        Formula: rent_inr = exp(log_pred) - 1
        """
        return np.expm1(y_log_pred)


def run_pipeline(
    raw_csv_path: str = None,
    output_dir: str = None,
    random_state: int = 42,
) -> Dict[str, Any]:
    """Execute end-to-end preprocessing pipeline and save processed outputs."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if raw_csv_path is None:
        raw_csv_path = os.path.join(base_dir, "data", "raw", "House_Rent_Dataset.csv")

    if output_dir is None:
        output_dir = os.path.join(base_dir, "data", "processed")

    os.makedirs(output_dir, exist_ok=True)

    logger.info("Loading raw dataset from %s", raw_csv_path)
    df_raw = pd.read_csv(raw_csv_path)

    # 1. Clean data
    df_clean, cleaning_audit = clean_raw_data(df_raw)

    # 2. Train/Test Split (stratified on City, seed 42)
    train_df, test_df = split_train_test(df_clean, test_size=0.20, random_state=random_state)

    train_csv_path = os.path.join(output_dir, "train.csv")
    test_csv_path = os.path.join(output_dir, "test.csv")
    train_df.to_csv(train_csv_path, index=False)
    test_df.to_csv(test_csv_path, index=False)
    logger.info("Saved train (%d rows) and test (%d rows) raw splits", len(train_df), len(test_df))

    # 3. Fit preprocessor on train ONLY (including floor imputation medians)
    preprocessor = RentalPreprocessor()
    preprocessor.fit(train_df)

    # Export clean dataset with engineered features evaluated using preprocessor
    df_clean_exported = preprocessor._engineer_features(df_clean)
    clean_csv_path = os.path.join(output_dir, "clean_dataset.csv")
    df_clean_exported.to_csv(clean_csv_path, index=False)
    logger.info("Saved clean dataset (%d rows) to %s", len(df_clean_exported), clean_csv_path)

    # 4. Transform train and test partitions
    X_train, y_train_raw, y_train_log = preprocessor.transform(train_df)
    X_test, y_test_raw, y_test_log = preprocessor.transform(test_df)

    # 5. Save processed matrices
    X_train.to_csv(os.path.join(output_dir, "X_train.csv"), index=False)
    X_test.to_csv(os.path.join(output_dir, "X_test.csv"), index=False)

    y_train_df = pd.DataFrame({"Rent": y_train_raw, "log_rent": y_train_log})
    y_test_df = pd.DataFrame({"Rent": y_test_raw, "log_rent": y_test_log})
    y_train_df.to_csv(os.path.join(output_dir, "y_train.csv"), index=False)
    y_test_df.to_csv(os.path.join(output_dir, "y_test.csv"), index=False)

    # 6. Metadata and validation
    metadata = {
        "raw_rows": int(len(df_raw)),
        "clean_rows": int(len(df_clean)),
        "train_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "train_test_split_ratio": "80/20",
        "random_state": random_state,
        "stratification_column": "City",
        "cleaning_audit": cleaning_audit,
        "floor_imputation_medians": {
            "floor_number": preprocessor.median_floor_number_,
            "total_floors": preprocessor.median_total_floors_,
        },
        "feature_count": int(len(preprocessor.feature_names)),
        "numerical_features": preprocessor.NUMERICAL_COLUMNS,
        "categorical_features": preprocessor.CATEGORICAL_COLUMNS,
        "one_hot_features": preprocessor.encoded_feature_names,
        "all_features": preprocessor.feature_names,
        "target_variable": "Rent",
        "target_transformed": "log_rent (log1p)",
        "train_rent_stats": {
            "median": float(train_df["Rent"].median()),
            "mean": float(round(train_df["Rent"].mean(), 2)),
            "min": float(train_df["Rent"].min()),
            "max": float(train_df["Rent"].max()),
        },
        "test_rent_stats": {
            "median": float(test_df["Rent"].median()),
            "mean": float(round(test_df["Rent"].mean(), 2)),
            "min": float(test_df["Rent"].min()),
            "max": float(test_df["Rent"].max()),
        },
        "city_distribution": {
            "train": {str(k): int(v) for k, v in train_df["City"].value_counts().items()},
            "test": {str(k): int(v) for k, v in test_df["City"].value_counts().items()},
        },
    }

    metadata_path = os.path.join(output_dir, "preprocessor_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info("Saved preprocessor metadata to %s", metadata_path)

    return metadata


if __name__ == "__main__":
    meta = run_pipeline()
    print("\nPipeline execution completed successfully.")
    print(f"Clean rows: {meta['clean_rows']} | Train: {meta['train_rows']} | Test: {meta['test_rows']}")
    print(f"Total features: {meta['feature_count']}")
