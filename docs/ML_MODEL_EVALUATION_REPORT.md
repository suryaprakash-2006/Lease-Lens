# LeaseLens — Machine Learning Model Evaluation Report
**Phase 5C: Model Training, Cross-Validation Benchmarking & Held-Out Evaluation**  
**Target Variable:** Monthly Residential Rent in INR (`Rent`)  
**Training Partition:** 3,776 samples (80% stratified split)  
**Held-Out Test Partition:** 944 samples (20% stratified split)  
**Execution Date:** 2026-10-13  
**Status:** COMPLETE (Ready for Phase 5D Gate Review)

---

## 1. Executive Summary

In Phase 5C, we developed, benchmarked, and evaluated machine learning regression models to predict monthly residential rent in INR for the LeaseLens platform. 

To guarantee statistical validity, we enforced a strict, leak-free evaluation methodology:
1. **Independent Within-Fold Preprocessing:** Feature engineering, categorical one-hot encoding, and numerical median imputations were fitted independently inside each cross-validation fold (on 3,020 samples), preventing in-sample fold leakage.
2. **Pristine Test Isolation:** The 944-sample held-out test partition was strictly sealed and never accessed during model exploration, algorithm selection, or hyperparameter decisions.
3. **Target Transformation & Retransformation Bias Analysis:** We empirically compared raw-scale regression against variance-stabilized log-transformed regression (`log1p`), evaluating both naive median inversion (`expm1`) and Duan’s non-parametric smearing retransformation.
4. **Final Model Selection:** **Gradient Boosting Regressor on `log1p(Rent)`** demonstrated the best overall generalization, achieving a cross-validated MAE of ₹10,955 and MedAE of ₹3,671.
5. **Held-Out Test Performance:** When evaluated on the 944-sample test partition, the final model achieved an **MAE of ₹10,589.90**, a **Median Absolute Error (MedAE) of ₹3,728.91**, an **R² of 0.6998**, a **MAPE of 30.64%**, and placed **46.08% of predictions within ±20%** of actual market rent.

---

## 2. Leak-Free Cross-Validation Protocol

### 2.1 The In-Sample Leakage Audit
In prior exploratory drafts, preprocessing had been fitted across all 3,776 training rows before cross-validation. While the test set was not exposed, fitting imputations (e.g., median floor number and mode total floors) across all training rows meant that validation folds contributed to their own imputation statistics during cross-validation.

In our audited benchmark:
- We initialized `RentalPreprocessor()` inside each of the 5 cross-validation folds.
- Each preprocessor computed imputations and category encodings solely from the 3,020 training fold rows.
- Feature scaling for regularized linear models (`StandardScaler`) was similarly fitted strictly within each fold.
- All models were evaluated across the **identical 5 folds** using fixed random seeds (`KFold(n_splits=5, shuffle=True, random_state=42)`).

### 2.2 Target Transformation & Retransformation Bias
Because raw monthly rent has high right skewness (raw skewness = 9.24, max = ₹12,00,000 INR vs median = ₹16,000 INR), models trained on raw target values are disproportionately pulled by extreme luxury rentals. Log transformation (`z = log(1 + Rent)`) compresses this skewness to 0.909, stabilizing residual variance across price tiers.

However, inverting log predictions introduces **retransformation bias** due to Jensen's Inequality:
$$\mathbb{E}[\exp(z)] \ge \exp(\mathbb{E}[z])$$
If $z | X \sim \mathcal{N}(\mu, \sigma^2)$, then $\mathbb{E}[1 + \text{Rent} | X] = \exp(\mu + \sigma^2 / 2)$. Consequently:
1. **Naive Exponentiation (`expm1`):** Predicts the **conditional median** of rent. The median is the theoretical minimizer of Mean Absolute Error (MAE). While it exhibits a slight downward bias on the expected conditional mean, it provides the lowest MAE and MedAE for typical users.
2. **Duan's Smearing Estimator (Duan, 1983):** Non-parametric smearing factor $s = \frac{1}{N} \sum_{i=1}^N \exp(e_i)$ corrects for retransformation bias without assuming normality. On LeaseLens training data, $s = 1.0645$. Multiplying by $s$ reduces mean underprediction bias from +₹3,016 down to +₹1,105, which slightly improves RMSE at a minor cost to MAE (+₹246 INR).

Both strategies were benchmarked across all models.

---

## 3. 5-Fold Cross-Validation Benchmark Results

All metrics below are computed on out-of-fold predictions on the 3,776-sample training set in real-world INR currency units:

| Model Family | Configuration | MAE (INR) | RMSE (INR) | R² Score | MedAE (INR) | MAPE (%) | Acc ≤ 20% | Mean Bias (INR) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline** | Dummy Mean | ₹30,387.11 | ₹61,708.34 | -0.0007 | ₹21,918.30 | 171.03% | 9.75% | +₹0.16 |
| **Baseline** | Dummy Median | ₹24,329.27 | ₹64,378.11 | -0.0891 | ₹8,000.00 | 65.36% | 21.77% | +₹18,416.68 |
| **Baseline** | City Median | ₹20,704.39 | ₹58,136.90 | 0.1118 | ₹6,275.00 | 56.85% | 27.04% | +₹12,596.86 |
| **Linear** | OLS (Raw Target) | ₹19,363.90 | ₹42,284.79 | 0.5301 | ₹10,116.85 | 81.13% | 16.29% | -₹2,392.82 |
| **Linear** | OLS (Log, Naive) | ₹12,291.78 | ₹36,058.71 | 0.6583 | ₹3,883.89 | 33.73% | 42.61% | +₹3,050.15 |
| **Regularized** | Ridge (Raw Target) | ₹19,214.88 | ₹42,350.36 | 0.5287 | ₹10,093.77 | 80.31% | 16.21% | -₹2,269.61 |
| **Regularized** | Ridge (Log, Naive) | ₹12,285.71 | ₹36,023.39 | 0.6590 | ₹3,905.73 | 33.71% | 42.64% | +₹3,123.93 |
| **Regularized** | Lasso (Raw Target) | ₹19,310.31 | ₹42,330.52 | 0.5291 | ₹10,041.56 | 80.73% | 16.71% | -₹2,331.52 |
| **Regularized** | Lasso (Log, Naive) | ₹12,234.65 | ₹35,900.97 | 0.6613 | ₹3,914.07 | 33.66% | 42.56% | +₹3,263.00 |
| **Tree Ensemble** | Random Forest (Raw) | ₹11,721.25 | **₹31,204.96** | **0.7441** | ₹4,059.45 | 38.30% | 41.05% | -₹302.61 |
| **Tree Ensemble** | Random Forest (Log, Naive) | ₹11,161.44 | ₹33,016.70 | 0.7135 | ₹3,758.94 | 32.15% | **44.17%** | +₹3,141.97 |
| **Tree Ensemble** | Random Forest (Log, Smear) | ₹11,203.10 | ₹32,780.48 | 0.7176 | ₹3,864.75 | 33.23% | 42.98% | +₹2,250.67 |
| **Boosting** | Gradient Boosting (Raw) | ₹11,908.40 | ₹32,188.87 | 0.7277 | ₹4,228.10 | 38.93% | 40.94% | -₹71.33 |
| **Boosting** | **Gradient Boosting (Log, Naive)** | **₹10,955.43** | ₹32,444.91 | 0.7234 | **₹3,671.46** | **31.59%** | 43.80% | +₹3,015.65 |
| **Boosting** | Gradient Boosting (Log, Smear) | ₹11,201.26 | ₹32,054.01 | 0.7300 | ₹3,934.58 | 34.17% | 42.24% | +₹1,105.14 |
| **Boosting** | XGBoost (Raw) | ₹12,070.06 | ₹32,476.26 | 0.7228 | ₹4,280.06 | 38.52 | 40.55% | -₹44.11 |
| **Boosting** | XGBoost (Log, Naive) | ₹11,151.46 | ₹32,816.59 | 0.7170 | ₹3,706.53 | 31.64% | 43.06% | +₹3,066.00 |
| **Boosting** | XGBoost (Log, Smear) | ₹11,304.47 | ₹32,425.04 | 0.7237 | ₹3,930.68 | 33.66% | 41.90% | +₹1,526.28 |

---

## 4. Model Selection Justification

1. **Superior Relative Accuracy:** Gradient Boosting Regressor (Log Target, Naive) achieved the lowest MAE (₹10,955) and lowest MedAE (₹3,671), cutting error by 47% compared to the City Median baseline (₹20,704) and by 64% compared to Dummy Mean (₹30,387).
2. **Balanced Relative Percentage Error:** The log-target formulation reduced MAPE from ~39% down to 31.59%, preventing luxury units from distorting predictions for affordable homes.
3. **Robustness vs XGBoost & Random Forest:** While Random Forest on raw target achieved slightly lower RMSE (₹31,205), its MAPE was 38.30% and MAE was ₹11,721 (worse by ₹766/month). Gradient Boosting demonstrated a tighter median residual spread and consistent performance across folds.

---

## 5. Final Evaluation on Held-Out Test Set (944 Samples)

Following model selection, the complete pipeline was fitted on the 3,776-sample training set and evaluated **strictly once** on the pristine test partition.

### 5.1 Test Performance Summary

| Model | Evaluation Split | MAE (INR) | RMSE (INR) | R² Score | MedAE (INR) | MAPE (%) | Acc ≤ 20% | Mean Bias (INR) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Baseline: Dummy Median | Held-Out Test | ₹23,317.80 | ₹54,390.15 | -0.1181 | ₹8,000.00 | 63.40% | 20.97% | +₹17,674.08 |
| Baseline: City Median | Held-Out Test | ₹19,666.85 | ₹47,437.03 | 0.1495 | ₹6,500.00 | 55.55% | 24.47% | +₹11,732.87 |
| **Selected GBDT (Naive)** | **Held-Out Test** | **₹10,589.90** | **₹28,181.80** | **0.6998** | **₹3,728.91** | **30.64%** | **46.08%** | **+₹3,208.99** |
| Selected GBDT (Smearing) | Held-Out Test | ₹10,745.89 | ₹28,282.36 | 0.6977 | ₹3,991.21 | 33.01% | 45.02% | +₹1,243.78 |

Additional Accuracy Thresholds on Test Set:
- **Within ±10% of Actual Rent:** **25.00%** (236 / 944 listings)
- **Within ±20% of Actual Rent:** **46.08%** (435 / 944 listings)
- **Within ±30% of Actual Rent:** **64.30%** (607 / 944 listings)

---

## 6. Property Segment Slice Analysis (Test Partition)

### 6.1 Geographic Slice (City)
| City | Test Count | Median Rent (INR) | MAE (INR) | RMSE (INR) | R² Score | MedAE (INR) | MAPE (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hyderabad** | 173 | ₹14,000 | ₹4,145.30 | ₹6,171.25 | **0.9056** | ₹2,645.64 | **24.86%** |
| **Bangalore** | 177 | ₹14,500 | ₹5,862.62 | ₹12,674.84 | 0.6329 | ₹2,960.11 | 28.56% |
| **Kolkata** | 104 | ₹8,000 | ₹5,112.05 | ₹17,435.69 | 0.0882 | ₹1,984.99 | 29.12% |
| **Chennai** | 178 | ₹14,000 | ₹7,254.70 | ₹19,749.64 | 0.5359 | ₹3,097.90 | 30.59% |
| **Mumbai** | 194 | ₹50,000 | ₹23,777.01 | ₹46,930.39 | 0.6780 | ₹11,168.06 | 32.66% |
| **Delhi** | 118 | ₹20,100 | ₹15,307.78 | ₹39,744.03 | 0.2627 | ₹5,061.51 | 40.31% |

*Insight:* Hyderabad has the highest predictive alignment ($R^2 = 0.9056$, MAPE = 24.86%). In Mumbai, base rents are more than 3x higher (median actual rent = ₹50,000), resulting in higher absolute MAE (₹23,777), but a relative error (MAPE = 32.66%) comparable to other metros.

### 6.2 Unit Configuration Slice (BHK)
| BHK Segment | Test Count | Median Rent (INR) | MAE (INR) | RMSE (INR) | R² Score | MedAE (INR) | MAPE (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1 BHK** | 228 | ₹10,000 | ₹4,433.45 | ₹8,305.23 | 0.6187 | ₹2,104.98 | 30.67% |
| **2 BHK** | 441 | ₹14,000 | ₹6,535.11 | ₹14,958.20 | 0.6304 | ₹3,162.09 | **27.55%** |
| **3 BHK** | 234 | ₹30,000 | ₹15,040.51 | ₹27,734.04 | **0.7439** | ₹7,805.30 | 33.61% |
| **4 BHK** | 34 | ₹110,000 | ₹53,364.07 | ₹92,350.82 | 0.1211 | ₹31,620.29 | 48.46% |

*Insight:* 2 BHK units comprise nearly half the dataset (441 / 944 listings) and achieve the lowest relative error (27.55% MAPE). 4 BHK units have small sample support (34 listings) with high variance.

### 6.3 Rental Price Tier Slice
| Rent Tier | Test Count | Median Rent (INR) | MAE (INR) | RMSE (INR) | MedAE (INR) | MAPE (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Budget (< ₹20k INR)** | 526 | ₹11,000 | ₹3,307.13 | ₹5,817.14 | ₹2,114.99 | 32.51% |
| **Mid-Tier (₹20k - ₹50k INR)** | 282 | ₹30,000 | ₹8,273.68 | ₹10,636.68 | ₹7,188.39 | 27.05% |
| **Premium (₹50k - ₹1.5L INR)** | 101 | ₹80,000 | ₹23,835.96 | ₹31,019.33 | ₹19,478.16 | 27.45% |
| **Luxury (> ₹1.5L INR)** | 35 | ₹200,000 | ₹100,477.32 | ₹131,241.43 | ₹69,874.23 | 40.62% |

---

## 7. Feature Importance Analysis

The top 10 features driving predictions in the Gradient Boosting model:

| Rank | Feature | Importance | Interpretation |
| :---: | :--- | :---: | :--- |
| 1 | `Size` | 0.46337 | Primary capacity determinant (square footage) |
| 2 | `City_Mumbai` | 0.29742 | Premium metro geographic premium |
| 3 | `Bathroom` | 0.08447 | Proxy for luxury tier and unit grade |
| 4 | `Area Type_Carpet Area` | 0.03859 | Premium pricing of actual usable carpet area |
| 5 | `City_Hyderabad` | 0.03212 | Market baseline discount vs national average |
| 6 | `City_Kolkata` | 0.02435 | Affordable metro adjustment |
| 7 | `total_floors` | 0.01633 | High-rise building amenity indicator |
| 8 | `BHK` | 0.01438 | Room count configuration |
| 9 | `floor_number` | 0.00947 | Vertical location within structure |
| 10 | `City_Bangalore` | 0.00612 | IT hub market baseline |

---

## 8. Operational Boundaries & Scope Limitations

1. **Economic Rent Ceiling:** The model scope is restricted to residential leases up to **₹20,00,000 INR/month**. Listings exceeding this ceiling are unverified and out-of-distribution.
2. **Geographic Coverage:** Validated strictly for the 6 metros in the dataset (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata). Predictions for unrepresented Tier-2/Tier-3 cities will default to baseline estimates.
3. **Dataset Redistribution License Status:** The redistribution rights for the underlying scraped dataset remain unresolved. The dataset and model binaries must not be committed to Git or redistributed publicly. The trained model is approved solely as an internal research prototype.
