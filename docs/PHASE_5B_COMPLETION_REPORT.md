# LeaseLens — Phase 5B Completion Report
**Phase:** 5B (Data Preprocessing & Exploratory Data Analysis)  
**Execution Date:** 2026-10-12  
**Status:** Completed Successfully — Ready for Review & Authorization of Phase 5C  

---

## 1. Executive Summary

Phase 5B of the LeaseLens project has concluded in strict accordance with the master specification and development roadmap. In this phase:
1. The primary dataset identified in Phase 5A (`House_Rent_Dataset.csv`) was acquired, cryptographically validated (SHA-256), and preserved untouched in `ml/data/raw/`.
2. A comprehensive data-quality inspection CLI (`ml/src/data_inspection.py`) and an interactive EDA notebook (`ml/notebooks/01_eda_and_data_cleaning.ipynb`) were developed to audit completeness, distributional properties, and bivariate correlations.
3. A modular, leak-free preprocessing pipeline (`ml/src/preprocessing.py`) was implemented to parse composite structural fields (`Floor`), clean documented anomalies, log-transform the continuous target variable (`Rent`), and partition the data into reproducible 80/20 train and test sets stratified by metropolitan city.
4. No regression models were trained, no model selection was performed, no FastAPI endpoints were added, and no existing Node.js backend or React frontend functionality was modified.
5. All 158 existing full-stack regression tests remain 100% green.

---

## 2. Dataset Verification & Preservation

* **Acquisition Path:** `ml/data/raw/House_Rent_Dataset.csv` (git-ignored).
* **Source:** Kaggle (`iamsouravbanerjee/house-rent-prediction-dataset`).
* **Author / Attribution:** Sourav Banerjee.
* **License Status & Provenance:**
  * **Kaggle Uploader Tag:** Listed as **`CC BY-SA 4.0`** (Creative Commons Attribution-ShareAlike 4.0 International).
  * **Underlying Source:** Scraped from MagicBricks.com commercial listings (mid-2022).
  * **Publisher Terms (MagicBricks):** Terms of Use explicitly prohibit unauthorized automated scraping, extraction, and redistribution. An uploader cannot grant public copyright licenses to third-party commercial listings.
  * **Legal Standing:** Licensing and redistribution rights for this dataset are **UNRESOLVED**. Fair-dealing or educational exemptions have not been legally established for this scraped collection. The dataset is retained strictly for local internal experimentation; the raw and processed CSVs are git-ignored and must not be published or redistributed.
* **Raw File Size:** 562,214 bytes (~549.04 KB).
* **SHA-256 Checksum:** `5f55b1040cdd9e7e79881c17a2ba2ba204fd153a6bc4cd32fa64c7d2d97ae15f`.
* **Raw Dimensions:** 4,746 rows × 12 columns.
* **Missing Values:** Exactly 0 missing values across all 12 columns.
* **Integrity Status:** The raw file remains pristine and untouched in `ml/data/raw/`.

---

## 3. Computed Data Quality & Inspection Findings

Computed empirically via [`ml/src/data_inspection.py`](../ml/src/data_inspection.py):

* **Target Variable (`Rent`):**
  * Currency & Cadence: Strictly recurring monthly rent denominated in Indian Rupees (INR).
  * Minimum: ₹1,200 | 1st Percentile: ₹4,000 | 25th Percentile: ₹10,000 | Median: ₹16,000 | Mean: ₹34,993.45 | 75th Percentile: ₹33,000 | 99th Percentile: ₹300,000 | Maximum: ₹3,500,000.
  * Skewness: **21.4099** (Severe positive right tail driven by ultra-luxury listings in South Mumbai and Bangalore).
* **Target Stabilization (`log1p(Rent)`):**
  * Applying $y_{\text{log}} = \ln(1 + \text{Rent})$ dramatically reduces skewness to **0.9090** (near-normal distribution) and kurtosis from 730.01 to 0.8163.
  * Inverse transformation formula documented for Phase 5C inference: $\hat{y}_{\text{INR}} = \exp(\hat{y}_{\text{log}}) - 1$.
* **Correlations with Target:**
  * Raw Rent: Bathroom (+0.4412), Size (+0.4136), BHK (+0.3697).
  * Log Rent (`log1p`): Bathroom (**+0.6921**), BHK (**+0.5963**), Size (**+0.5679**).
* **Floor Column Inspection:**
  * 4,742 records contain composite pattern `"X out of Y"`.
  * 4 records contain standalone floor levels (`"1"`, `"3"`, `"Ground"`).
  * Non-numeric floor labels identified: `"Ground"` (level 0), `"Upper Basement"` (level -1), `"Lower Basement"` (level -2).
  * All 4,746 listings are 100% parseable. Zero listings excluded due to floor parsing.

---

## 4. Cleaning Decisions & Row Retention Audit

Implemented in [`clean_raw_data()`](../ml/src/preprocessing.py#L65):

| Step | Rule | Rationale | Dropped | Remaining |
|:---:|---|---|:---:|:---:|
| 0 | **Raw Dataset Ingestion** | Initial raw records | — | 4,746 (100.00%) |
| 1 | **Deduplication** | Identical unit features published across separate scraper dates (excluding `Posted On`) | 8 | 4,738 (99.83%) |
| 2 | **Predeclared Domain Rent Ceiling (> ₹2,000,000 INR/mo)** | Monthly rent exceeds proposed domain restriction (Raw Row 1837: 3 BHK, 2,500 sq ft, Floor '4 out of 4', 3 Bathrooms, Marathahalli at ₹35,00,000; unverified extreme outlier; operational scope bounded to leases <= 20L INR) | 1 | 4,737 (99.81%) |
| 3 | **Impossible Unit Size (< 50 sq ft)** | Residential units < 50 sq ft (e.g., 3 BHK with 10 sq ft, 1 BHK with 20 sq ft) | 16 | 4,721 (99.47%) |
| 4 | **Non-Residential Outlier (> 7 Bathrooms)** | 1 BHK hostel/farmhouse with 10 bathrooms and 8,000 sq ft in Hyderabad | 1 | 4,720 (99.45%) |
| 5 | **Floor Parsing & Missing-Value Fallback** | Standalone floors ("Ground", "1", "3") parsed to valid levels with training-median total_floors fallback; zero unparseable listings | 0 | 4,720 (99.45%) |

* **Total Excluded:** Exactly 26 rows (0.55%). Pairwise overlap between rules is 0.
* **Clean Dataset Retained:** **4,720 rows (99.45%)**.
* **Legitimate High-Value Rentals:** Fully preserved (e.g., Mumbai Juhu at ₹12,00,000, Worli at ₹10,00,000, Breach Candy at ₹8,50,000, Delhi Anand Niketan at ₹5,30,000).

---

## 5. Feature Engineering & Preprocessing Pipeline

Implemented in [`RentalPreprocessor`](../ml/src/preprocessing.py#L140):

1. **Structural Floor Decomposition:**
   * `floor_number`: Signed integer floor level (-2 to 76).
   * `total_floors`: Integer total building height (1 to 89).
   * `floor_ratio`: Continuous elevation ratio ($\text{floor\_number} / \text{total\_floors}$).
2. **Leakage Elimination:**
   * Excluded `Posted On` (scraping timestamp).
   * Excluded `Point of Contact` (marketing channel).
3. **One-Hot Encoding (Fit on Train Partition Only):**
   * `City` (6 levels: Bangalore, Chennai, Delhi, Hyderabad, Kolkata, Mumbai).
   * `Furnishing Status` (3 levels: Furnished, Semi-Furnished, Unfurnished).
   * `Tenant Preferred` (3 levels: Bachelors, Bachelors/Family, Family).
   * `Area Type` (3 levels: Built Area, Carpet Area, Super Area).
4. **Feature Space:** Exactly **21 features** (6 numerical + 15 one-hot encoded binary columns).

---

## 6. Train/Test Partitioning & Leakage Safeguards

* **Partitioning:** 80% Train / 20% Test via [`split_train_test()`](../ml/src/preprocessing.py#L125).
* **Stratification:** Stratified strictly on `City` to preserve metropolitan distribution across splits.
* **Random Seed:** Deterministic `random_state = 42`.
* **Disjointness:** Zero index overlap between training and testing partitions.
* **Leakage Protocol:** `RentalPreprocessor` is fitted strictly on the 3,776 training records. Transform is applied to the 944 test records without parameter re-estimation.

### Partition Balance Comparison:

| Dimension | Full Clean Dataset | Train Partition (80%) | Test Partition (20%) |
|---|---|---|---|
| **Total Rows** | 4,720 | 3,776 | 944 |
| **Mumbai Ratio** | 20.53% (969) | 20.52% (775) | 20.55% (194) |
| **Chennai Ratio** | 18.88% (891) | 18.88% (713) | 18.86% (178) |
| **Bangalore Ratio**| 18.75% (885) | 18.75% (708) | 18.75% (177) |
| **Hyderabad Ratio**| 18.31% (864) | 18.30% (691) | 18.33% (173) |
| **Delhi Ratio**    | 12.50% (590) | 12.50% (472) | 12.50% (118) |
| **Kolkata Ratio**  | 11.04% (521) | 11.04% (417) | 11.02% (104) |
| **Median Rent**    | ₹16,000 | ₹16,000 | ₹16,500 |
| **Mean Rent**      | ₹34,268 | ₹34,417 | ₹33,674 |

---

## 7. Deliverables & Artifact Inventory

1. [`ml/src/data_inspection.py`](../ml/src/data_inspection.py): CLI tool for statistical data quality audits.
2. [`ml/src/preprocessing.py`](../ml/src/preprocessing.py): End-to-end cleaning, floor parsing, and encoding pipeline.
3. [`ml/notebooks/01_eda_and_data_cleaning.ipynb`](../ml/notebooks/01_eda_and_data_cleaning.ipynb): Interactive exploratory data analysis notebook with markdown commentary.
4. [`docs/ML_DATA_QUALITY_REPORT.md`](./ML_DATA_QUALITY_REPORT.md): Comprehensive 9-section data quality report with exact computed numbers.
5. `ml/data/processed/`:
   * `clean_dataset.csv` (4,720 rows)
   * `train.csv` (3,776 rows) & `test.csv` (944 rows)
   * `X_train.csv` (3,776 × 21) & `X_test.csv` (944 × 21)
   * `y_train.csv` & `y_test.csv` (with `Rent` and `log_rent`)
   * `preprocessor_metadata.json` (feature metadata, cleaning audit, partition stats)
6. [`docs/PHASE_5B_COMPLETION_REPORT.md`](./PHASE_5B_COMPLETION_REPORT.md): Official Phase 5B completion report.

---

## 8. Verification & Regression Status

* **ML Pipeline Verification:**
  * Clean state re-run of `ml/src/data_inspection.py`: Passed (0 errors).
  * Clean state re-run of `ml/src/preprocessing.py`: Passed (0 errors, 4,720 clean rows, 21 features).
* **Full-Stack Regression Test Suite:**
  * Backend Auth Suite (`backend/test_auth.js`): 29 passed, 0 failed.
  * Backend Domain Suite (`backend/test_phase2.js`): 70 passed, 0 failed.
  * Frontend Auth Integration (`frontend/test_frontend_integration.js`): 15 passed, 0 failed.
  * Frontend CRUD Flow (`frontend/test_frontend_crud.js`): 44 passed, 0 failed.
  * **Total Test Score:** **158 passed / 0 failed (100% pass rate)**.
* **Git Repository Integrity:**
  * Raw dataset (`ml/data/raw/*`) and processed files (`ml/data/processed/*`) confirmed git-ignored.
  * No secrets, caches, or unapproved dependencies staged.

---

## 9. Stop Condition & Transition Gate to Phase 5C

In accordance with strict protocol:
* **STOP CONDITION OBSERVED:** No machine learning models were trained. No model selection or hyperparameter tuning was conducted. No FastAPI microservice was generated. No Node.js backend or React UI files were modified.
* **Next Phase (Phase 5C):** Model Training, Validation, and Benchmarking (Linear Regression baseline, Random Forest Regressor, XGBoost Regressor with MAE, RMSE, and $R^2$ evaluated on the original INR scale).
* **Action Required:** Awaiting explicit authorization from the user before initiating Phase 5C.
