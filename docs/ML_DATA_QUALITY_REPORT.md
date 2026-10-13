# LeaseLens — Machine Learning Data Quality & EDA Report

**Phase:** Phase 5B (Data Preprocessing & Exploratory Data Analysis)  
**Execution Date:** 2026-10-12  
**Dataset:** House Rent Prediction Dataset (`House_Rent_Dataset.csv`)  
**Target Variable:** Monthly Rent in INR (`Rent`)  
**Pipeline Scripts:** [`ml/src/data_inspection.py`](../ml/src/data_inspection.py), [`ml/src/preprocessing.py`](../ml/src/preprocessing.py)  
**Jupyter Notebook:** [`ml/notebooks/01_eda_and_data_cleaning.ipynb`](../ml/notebooks/01_eda_and_data_cleaning.ipynb)  

---

## 1. Executive Summary

During Phase 5B, the primary rental housing dataset selected in Phase 5A was acquired, cryptographically verified, and analyzed through automated statistical inspection scripts and an exploratory data analysis notebook. A zero-leakage preprocessing pipeline was implemented to clean physical anomalies, extract structural floor levels, stabilize target skewness via logarithmic transformation, and partition the data into reproducible 80/20 train and test sets stratified by metropolitan city.

---

## 2. Dataset Provenance & Integrity

* **Source Repository:** Kaggle (`iamsouravbanerjee/house-rent-prediction-dataset`)
* **License Status & Provenance:**
  * **Kaggle Metadata Tag:** Listed as **`CC BY-SA 4.0`** (or `Other / CC BY-SA 4.0` across mirrors).
  * **Underlying Primary Source:** Scraped from MagicBricks.com listings (mid-2022).
  * **Publisher Terms:** MagicBricks Terms of Use prohibit unauthorized automated extraction, reproduction, and commercial redistribution. An uploader cannot grant public copyright licenses to third-party listings.
  * **Legal Standing:** Licensing and redistribution rights for this dataset are **UNRESOLVED**. Fair-dealing or educational exemptions have not been legally established for this scraped compilation. The dataset is held for local internal experimentation only; the raw and processed CSVs are git-ignored and must not be published or redistributed.
* **File Size:** 562,214 bytes (~549.04 KB)
* **Cryptographic Checksum (SHA-256):** `5f55b1040cdd9e7e79881c17a2ba2ba204fd153a6bc4cd32fa64c7d2d97ae15f`
* **Raw Dimensions:** 4,746 rows × 12 columns
* **Missing Values:** Exactly **0 missing values (0.00%)** across all 12 columns.
* **Exact Duplicate Rows:** Exactly **0 duplicates** across all 12 columns.

---

## 3. Computed Summary Statistics (Raw Data)

### 3.1 Numeric Features

All statistics were empirically calculated directly on the raw dataset:

| Feature | Data Type | Mean | Std Dev | Min | 1% | 25% | Median (50%) | 75% | 95% | 99% | Max | Skewness |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **BHK** | `int64` | 2.08 | 0.83 | 1 | 1.0 | 2.0 | 2.0 | 3.0 | 3.0 | 4.0 | 6 | 0.60 |
| **Size (sq ft)** | `int64` | 967.49 | 634.20 | 10 | 70.0 | 550.0 | 850.0 | 1,200.0 | 2,000.0 | 3,289.2 | 8,000 | 2.30 |
| **Bathroom** | `int64` | 1.97 | 0.88 | 1 | 1.0 | 1.0 | 2.0 | 2.0 | 3.0 | 5.0 | 10 | 1.27 |
| **Rent (INR/mo)** | `int64` | 34,993.45 | 78,106.41 | 1,200 | 4,000.0 | 10,000.0 | 16,000.0 | 33,000.0 | 130,000.0 | 300,000.0 | 3,500,000 | **21.41** |

### 3.2 Target Variable Analysis & Log-Transformation Evaluation

* **Cadence & Currency:** Confirmed strictly as recurring **monthly rent denominated in Indian Rupees (INR)**.
* **Distribution Properties:** The raw rent variable displays severe positive skewness ($\gamma = 21.41$) and heavy kurtosis ($\kappa = 730.01$). While the median rent across all 6 metropolitan areas is ₹16,000/month, the mean is elevated to ₹34,993.45 due to an extended luxury right tail terminating at ₹3,500,000.
* **Log-Transformation Justification:** Applying a natural logarithm transformation ($y_{\text{log}} = \ln(1 + \text{Rent})$) drastically reduces skewness to **0.9090** and kurtosis to **0.8163**, normalizing the residual distribution and preventing high-value luxury properties from dominating ordinary least squares (OLS) and gradient loss functions.
* **Inversion Back to INR:** In regression inference, model predictions will be returned to monetary INR via the exact inverse transformation:
  $$\hat{y}_{\text{INR}} = \exp(\hat{y}_{\text{log}}) - 1$$
* **Evaluation Standard:** All validation and test error metrics (MAE, RMSE) must be computed in original INR to preserve business interpretability.

| Metric | Raw Target (`Rent`) | Transformed Target (`log1p(Rent)`) |
|---|---|---|
| **Mean** | ₹34,993.45 | 9.8943 |
| **Median** | ₹16,000.00 | 9.6804 |
| **Std Dev** | ₹78,106.41 | 0.9416 |
| **Skewness** | **21.4099** (Extreme Right Skew) | **0.9090** (Near-Normal Distribution) |
| **Kurtosis** | **730.01** (Heavy-Tailed) | **0.8163** (Platykurtic / Standard) |

---

## 4. Categorical Distributions & Geographic Coverage

The dataset spans six tier-1 metropolitan markets in India with the following frequency distribution:

```
City Distribution:
  Mumbai:     972 listings (20.48%) — Median: ₹52,000 | Mean: ₹85,321 | Max: ₹1,200,000
  Chennai:    891 listings (18.77%) — Median: ₹14,000 | Mean: ₹21,614 | Max: ₹600,000
  Bangalore:  886 listings (18.67%) — Median: ₹14,000 | Mean: ₹24,966 | Max: ₹3,500,000
  Hyderabad:  868 listings (18.29%) — Median: ₹14,000 | Mean: ₹20,555 | Max: ₹400,000
  Delhi:      605 listings (12.75%) — Median: ₹17,000 | Mean: ₹29,462 | Max: ₹530,000
  Kolkata:    524 listings (11.04%) — Median: ₹8,500  | Mean: ₹11,645 | Max: ₹180,000
```

Additional Categorical Fields:
* **Furnishing Status:** Semi-Furnished: 2,251 (47.43%), Unfurnished: 1,815 (38.24%), Furnished: 680 (14.33%).
* **Tenant Preferred:** Bachelors/Family: 3,444 (72.57%), Bachelors: 830 (17.49%), Family: 472 (9.95%).
* **Area Type:** Super Area: 2,446 (51.54%), Carpet Area: 2,298 (48.42%), Built Area: 2 (0.04%).
* **Point of Contact:** Contact Owner: 3,216 (67.76%), Contact Agent: 1,529 (32.22%), Contact Builder: 1 (0.02%).
* **Area Locality:** 2,235 distinct localities across 4,746 rows.

---

## 5. Correlations with Target Variable

| Feature | Correlation with Raw Rent | Correlation with Log-Transformed Rent (`log1p`) |
|---|---|---|
| **Bathroom** | +0.4412 | **+0.6921** |
| **BHK** | +0.3697 | **+0.5963** |
| **Size (sq ft)** | +0.4136 | **+0.5679** |

*Key Insight:* On the log-transformed scale, `Bathroom`, `BHK`, and `Size` exhibit significantly stronger linear correlation with rental price (+0.56 to +0.69), validating the log-transformation approach.

---

## 6. Data Cleaning Decisions & Row Audit

A conservative, highly defensible 4-stage data cleaning procedure was established in [`ml/src/preprocessing.py`](../ml/src/preprocessing.py). Rather than trimming records simply because they were expensive or unusual, records were only excluded if they constituted duplicates, physical impossibilities, or verified clerical typos:

```
Initial Raw Records: 4,746 (100.00%)
========================================================================================
1. Deduplication (excluding scraping timestamp 'Posted On'):
   - Records Dropped: 8
   - Rationale: Identical listings posted across multiple crawl dates with matching
     unit specs, rent, location, and contact agent.
2. Predeclared Residential Economic Rent Ceiling (> 2,000,000 INR / month):
   - Records Dropped: 1 (Raw Row 1837: 3 BHK, 2,500 sq ft, Floor '4 out of 4', 3 Bathrooms, Carpet Area, Marathahalli, Bangalore, listed at ₹3,500,000 / month)
   - Rationale: While primary crawler logs from 2022 cannot be verified directly to confirm an intended ₹35,000/mo or a total sale price/deposit error, ₹35 Lakh/month is an unverified extreme outlier ($100x$ to $250x$ locality baseline of ₹15,000–₹35,000). Formulated as a static proposed domain restriction (Rent <= ₹20 Lakhs) bounding the operational scope of the model. Model results do not establish performance above this ceiling. Zero sample parameter estimation leakage.
   - Luxury Preservation Audit: The highest legitimate luxury listing in the entire dataset is
     Row 1001 (Mumbai Juhu 4 BHK, 5,000 sq ft at ₹12,00,000), followed by Row 827 (Mumbai Worli
     at ₹10,00,000). The ₹20 Lakh ceiling provides an ₹800,000 safety buffer above the highest
     luxury penthouse in India and excludes ZERO legitimate luxury properties.
   - Rent/Sq-Ft Threshold Audit: Testing an alternative threshold of Rent/Size > ₹1,000/sq-ft
     revealed potential hazards due to square-yard ("gaj") entry ambiguities in Delhi and Hyderabad
     (e.g., Row 4004 at exactly ₹1,000/sq-ft). The absolute ceiling of ₹20 Lakhs is cleaner,
     unambiguous, and isolates Row 1837 without ratio distortions.
3. Physical Impossibility in Unit Size (< 50 sq ft):
   - Records Dropped: 16
   - Rationale: Independent residential units under 50 sq ft (e.g., 3 BHK with 10 sq ft,
     or 1 BHK with 20 sq ft) represent unit-of-measure entry errors (such as gaj/yards).
4. Non-Residential Bathroom Outlier (> 7 Bathrooms):
   - Records Dropped: 1 (Row 4185: 1 BHK with 10 bathrooms and 8,000 sq ft)
   - Rationale: Commercial hostel / farmhouse anomaly listed inappropriately under 1 BHK.
========================================================================================
Final Clean Records: 4,720 (99.45% retained, 26 total records excluded)
```

**Preservation of Legitimate Luxury Properties:**
All 12 top luxury residential listings (Rent $\ge$ ₹5,00,000/month)—including penthouses in Mumbai (Juhu at ₹12,00,000, Worli Raheja Artesia at ₹10,00,000, Breach Candy at ₹8,50,000), Delhi (Anand Niketan at ₹5,30,000), and Chennai (Vettuvankeni at ₹6,00,000)—are 100% retained. Zero legitimate luxury properties are pruned.

---

## 7. Feature Engineering

1. **Floor Parsing:**
   The composite string field `Floor` (e.g., `"Ground out of 2"`, `"3 out of 10"`, `"Upper Basement out of 4"`) was decomposed:
   * `floor_number`: Parsed to signed integers (`"Ground"` $\rightarrow 0$, `"Upper Basement"` $\rightarrow -1$, `"Lower Basement"` $\rightarrow -2$, `"N"` $\rightarrow N$).
   * `total_floors`: Parsed to positive integer building height ($M$ from `"out of M"`).
   * `floor_ratio`: Continuous structural ratio ($\text{floor\_number} / \max(\text{total\_floors}, 1)$).
2. **Leakage Elimination:**
   * Excluded `Posted On` (scraper date) to prevent temporal overfitting.
   * Excluded `Point of Contact` to isolate property fundamentals from broker marketing channels.
3. **Categorical Feature Encoding:**
   * One-hot encoding fitted strictly on the training partition: `City` (6 levels), `Furnishing Status` (3 levels), `Tenant Preferred` (3 levels), `Area Type` (3 levels).

---

## 8. Train/Test Splitting & Leakage Prevention

* **Split Ratio:** 80% Train (3,776 rows) / 20% Test (944 rows).
* **Stratification:** Stratified by `City` to guarantee geographic balance across all 6 metropolitan areas.
* **Random Seed:** Deterministic `random_state = 42`.
* **Disjointness:** Exact 0 row overlap between train and test sets.
* **Leakage Protocol:** All encoders, categories, and transformations are fit strictly on `train_df`. The test partition remains held out until final model benchmarking in Phase 5C.

### Partition Metrics Comparison:

| Partition | Rows | Median Rent (INR) | Mean Rent (INR) | Min Rent (INR) | Max Rent (INR) |
|---|---|---|---|---|---|
| **Training (80%)** | 3,776 | ₹16,000 | ₹34,416.68 | ₹1,200 | ₹1,200,000 |
| **Testing (20%)** | 944 | ₹16,500 | ₹33,674.08 | ₹2,200 | ₹650,000 |

---

## 9. Produced Artifacts & Files

| Artifact Path | Format | Description |
|---|---|---|
| [`ml/data/raw/House_Rent_Dataset.csv`](../ml/data/raw/House_Rent_Dataset.csv) | CSV (Raw) | Original preserved dataset (562 KB, git-ignored). |
| [`ml/data/processed/clean_dataset.csv`](../ml/data/processed/clean_dataset.csv) | CSV | Cleaned 4,720-record dataset with parsed floor fields (git-ignored). |
| [`ml/data/processed/train.csv`](../ml/data/processed/train.csv) | CSV | 80% train split (3,776 rows) prior to one-hot encoding (git-ignored). |
| [`ml/data/processed/test.csv`](../ml/data/processed/test.csv) | CSV | 20% held-out test split (944 rows) (git-ignored). |
| [`ml/data/processed/X_train.csv`](../ml/data/processed/X_train.csv) | CSV | Preprocessed feature matrix for training (3,776 rows × 21 columns) (git-ignored). |
| [`ml/data/processed/X_test.csv`](../ml/data/processed/X_test.csv) | CSV | Preprocessed feature matrix for testing (944 rows × 21 columns) (git-ignored). |
| [`ml/data/processed/y_train.csv`](../ml/data/processed/y_train.csv) | CSV | Training target vectors (`Rent` in INR, `log_rent`) (git-ignored). |
| [`ml/data/processed/y_test.csv`](../ml/data/processed/y_test.csv) | CSV | Testing target vectors (`Rent` in INR, `log_rent`) (git-ignored). |
| [`ml/data/processed/preprocessor_metadata.json`](../ml/data/processed/preprocessor_metadata.json) | JSON | Complete feature names, cleaning audit, and partition metrics (git-ignored). |
| [`ml/src/data_inspection.py`](../ml/src/data_inspection.py) | Python | Executable data quality and statistical audit CLI. |
| [`ml/src/preprocessing.py`](../ml/src/preprocessing.py) | Python | Production preprocessing module and transformation pipeline. |
| [`ml/notebooks/01_eda_and_data_cleaning.ipynb`](../ml/notebooks/01_eda_and_data_cleaning.ipynb) | Jupyter Notebook | Complete EDA notebook with distribution plots, boxplots, and audit notes. |
| [`docs/ML_DATA_QUALITY_REPORT.md`](./ML_DATA_QUALITY_REPORT.md) | Markdown | This comprehensive data quality and EDA report. |
