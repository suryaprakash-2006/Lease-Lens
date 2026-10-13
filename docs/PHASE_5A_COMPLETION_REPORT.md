# LeaseLens — Phase 5A Completion Report
**Phase:** 5A (ML Dataset Research & Problem Definition)  
**Execution Date:** 2026-10-06  
**Status:** Completed Successfully — Ready for Review & Authorization of Phase 5B  

---

## 1. Executive Summary

Phase 5A of the LeaseLens project has concluded in strict adherence to the master specification. In this phase, comprehensive research was conducted across multiple public rental and housing datasets to define a defensible supervised machine learning problem for rental price prediction. No models were trained, no ML libraries were prematurely installed, and no existing Node.js backend or React frontend functionality was altered.

---

## 2. Datasets Investigated

Five candidate datasets were investigated and audited against the 19 evaluation dimensions:

1. **House Rent Prediction Dataset** (Sourav Banerjee, Kaggle)
   * *Scope:* 4,746 listings across 6 Indian Metropolitan Cities (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata).
   * *Target:* Monthly Rent in INR (`Rent`).
   * *Status:* **SELECTED AS PRIMARY DATASET.**
2. **Property Rental Listings Dataset** (Harshal H / Magicbricks, Kaggle)
   * *Scope:* ~3,100 listings in the Mumbai Metropolitan Region.
   * *Target:* Monthly Rent in INR (`Price`).
   * *Status:* **SELECTED AS BACKUP DATASET.**
3. **Rental Properties Dataset: House & Apartment Listings - New Delhi** (PromptCloud / DataStock, Makaan)
   * *Scope:* ~14,000 listings confined to Delhi NCR.
   * *Target:* Monthly Rent in INR (`rent`).
   * *Status:* Disqualified due to unclear redistribution licensing and severe leakage risk from security deposit attribute.
4. **USA Housing Listings** (Austin Reese, Craigslist)
   * *Scope:* 384,977 listings across the United States.
   * *Target:* Monthly Rent in USD (`price`).
   * *Status:* Disqualified due to geographic scope mismatch (US market, USD pricing, non-Indian room typologies).
5. **Bengaluru House Price Data** (Amitabha Chakraborty, Kaggle)
   * *Scope:* 13,320 real estate listings in Bengaluru.
   * *Target:* Capital Sale/Purchase Price in Lakhs INR (`price`).
   * *Status:* **DISQUALIFIED DUE TO TARGET MISMATCH.** Target represents capital sale price, not recurring monthly rent.

---

## 3. License Findings

* **Primary Dataset (`iamsouravbanerjee/house-rent-prediction-dataset`):**
  * Kaggle metadata tag: **`Other (specified in description)`**.
  * Description acknowledges compilation from MagicBricks without an explicit Creative Commons grant text.
  * Widely cited under CC BY in academic publications, but primary publisher grant requires formal user review prior to commercial or production deployment.
* **Verified Open Alternative Dataset (`iamsaver/house-rent-prices-of-metropolitan-cities-in-india`):**
  * Licensed under **CC0: Public Domain** on Kaggle.
  * Covers ~200,000 listings across 8 Indian metros (Makaan scrape). Designated failover if Candidate 1 terms are rejected.
* **Backup Single-City Dataset (`harshalh/property-rental-listings-dataset`):**
  * Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).
  * Covers Mumbai Metropolitan Region only.
* **Disqualified Datasets:**
  * PromptCloud Delhi NCR dataset marked as *"License unclear — do not use for final project dataset without further verification."*

---

## 4. Target Variable Analysis

* **Target Variable:** `Rent` (Primary) / `Price` (Backup).
* **Cadence:** Explicitly verified as **monthly rental price**.
* **Currency:** Uniform Indian Rupees (INR / ₹).
* **Distribution Findings:** Extreme right skewness (minimum ₹1,200/month, median ₹16,000/month, maximum ₹3,500,000/month). Luxury properties in Mumbai drive a long right tail.
* **Modeling Implication:** Log transformation ($\ln(y)$ or $\log_{10}(y)$) will be required during Phase 5B to stabilize target variance and normalize residual errors for linear algorithms.

---

## 5. Feature Findings & Schema Alignment

The primary dataset provides 11 candidate features with **zero missing values** across all 4,746 rows. The features directly map to LeaseLens's Mongoose `Property` model:

| Primary Dataset Column | LeaseLens Domain Field | Data Type | Preprocessing Plan |
|---|---|---|---|
| `BHK` | `bhk` / `bedrooms` | Integer (1–6) | Numeric / Scaled |
| `Size` | `areaSqFt` | Integer (10–8,000) | Numerical / Outlier Capped |
| `Bathroom` | `bathrooms` | Integer (1–10) | Numeric / Scaled |
| `City` | `address.city` | Categorical (6 cities) | One-Hot Encoded |
| `Furnishing Status` | `furnishingStatus` | Categorical (3 levels) | Ordinal / One-Hot |
| `Area Type` | `propertyType` (proxy) | Categorical (3 levels) | One-Hot Encoded |
| `Area Locality` | `address.locality` | Categorical (2,235 levels) | High-cardinality target/frequency encoding |
| `Floor` | N/A (structural attribute) | String (e.g. `"1 out of 3"`) | Parsed into `Floor_Number` & `Total_Floors` |
| `Tenant Preferred` | N/A (lease policy) | Categorical (3 levels) | One-Hot Encoded |

---

## 6. Data Leakage Findings

1. **`Posted On` (Scraping Date):** Excluded from model features to prevent temporal overfitting to the scraper's crawl window (May–July 2022).
2. **`Point of Contact` (Listing Source):** Excluded to prevent broker marketing channel bias from contaminating intrinsic property valuation.
3. **Target Isolation:** Verified that no derived fields (e.g., rent-per-sqft, security deposit, tenant payment history) exist prior to prediction.

---

## 7. Limitations Identified

1. **Locality Cardinality:** Over 2,200 distinct localities in 4,746 rows. Rare localities with < 3 listings must be pooled into `"Other"` or encoded carefully to prevent high-dimensional variance.
2. **Compound Text Fields:** `Floor` contains composite strings (e.g., `"Ground out of 2"`, `"3 out of 10"`) requiring robust regular expression parsing.
3. **Temporal Horizon:** Sourced in 2022. While relative structural values and spatial differentials remain robust, nominal values reflect 2022 levels.

---

## 8. Exact Recommendation for Phase 5B

When authorized by the user, **Phase 5B (Data Preprocessing & Exploratory Data Analysis)** should execute the following sequence:

1. **Acquire Primary Dataset:** Download and place `House_Rent_Dataset.csv` into `ml/data/raw/House_Rent_Dataset.csv` (git-ignored).
2. **Exploratory Data Analysis (EDA):** Create notebook `ml/notebooks/01_eda_and_data_cleaning.ipynb` to analyze distributions, correlations, and city-wise median rents.
3. **Implement Feature Engineering & Preprocessing Module:**
   * Parse `Floor` into `floor_number` and `total_floors`.
   * Apply outlier bounds on `Size` (e.g., filter entries < 100 sq ft or > 6,000 sq ft).
   * Apply outlier bounds or log-transform on `Rent`.
   * Frequency-encode or group rare `Area Locality` entries.
   * One-hot encode `City`, `Furnishing Status`, `Area Type`, and `Tenant Preferred`.
4. **Data Partitioning:**
   * Create deterministic 80/20 train/test split with stratification on `City` to ensure balanced geographic representation.
   * Save clean partitions to `ml/data/processed/train.csv` and `ml/data/processed/test.csv`.
5. **No Model Training in 5B:** Model benchmarking remains reserved for Phase 5C.

---

## 9. Verification & Regression Status

* **Documentation Created:**
  * [`docs/ML_DATASET_RESEARCH.md`](./ML_DATASET_RESEARCH.md)
  * [`docs/PHASE_5A_COMPLETION_REPORT.md`](./PHASE_5A_COMPLETION_REPORT.md)
  * [`ml/README.md`](../ml/README.md)
* **Automated Regression Suite:** 158 tests passing across backend and frontend (0 failed).
* **Git Status:** Clean tree, no API keys, no secrets, no large datasets staged.
