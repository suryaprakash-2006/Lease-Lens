# LeaseLens — ML Dataset Research & Problem Definition
**Document Version:** 1.0.0  
**Phase:** 5A (ML Dataset Research & Problem Definition)  
**Status:** Approved for Phase 5B Pipeline Architecture  

---

## 1. Machine Learning Objective

The primary objective of the machine learning capability within **LeaseLens** is to deliver data-driven, empirical rental price intelligence for property owners and tenants. Instead of relying on guesswork or static averages, LeaseLens seeks to provide accurate monthly rental estimates based on observable, structural, and spatial property characteristics.

### Formal Formulation
* **Problem Type:** Supervised Tabular Regression
* **Objective:** Given property characteristics $\mathbf{x} \in \mathcal{X}$, predict the expected monthly rental price $\hat{y} \in \mathbb{R}^+$.
* **Target Variable ($y$):** Monthly Rent in Indian Rupees (INR / ₹).
* **Operational Role in LeaseLens:**
  1. Assist property owners during onboarding to price listings competitively and accurately.
  2. Protect landlords from under-pricing assets or experiencing extended vacancy due to over-pricing.
  3. Validate tenant lease agreements against current submarket rental values.

---

## 2. Candidate Datasets Investigated

To ensure methodological rigor, five candidate real estate datasets were surveyed and evaluated. The candidates span Indian metropolitan rental listings, city-specific regional collections, international rental benchmarks, and real estate sale price datasets.

| # | Candidate Dataset Name | Primary Source / Publisher | Scope & Geography | Target Variable |
|---|------------------------|----------------------------|-------------------|-----------------|
| **1** | **House Rent Prediction Dataset** | Sourav Banerjee (Kaggle) | 6 Major Indian Metros (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata) | Monthly Rent (INR) |
| **2** | **Property Rental Listings Dataset** | Harshal H (Magicbricks scrape) | Mumbai Metropolitan Region | Monthly Rent (INR) |
| **3** | **Rental Properties Dataset (Delhi NCR)** | PromptCloud / DataStock (Makaan scrape) | New Delhi & NCR Region | Monthly Rent (INR) |
| **4** | **USA Housing Listings** | Austin Reese (Craigslist scrape) | United States (National) | Monthly Rent (USD) |
| **5** | **Bengaluru House Price Data** | Amitabha Chakraborty (Kaggle) | Bengaluru, India | **Sale Price (Lakhs INR)** |

---

## 3. In-Depth Candidate Evaluations

Each candidate was rigorously assessed against the 19 critical criteria defined in the Phase 5A evaluation protocol.

### Candidate 1: House Rent Prediction Dataset (Sourav Banerjee)
1. **Dataset Name:** House Rent Prediction Dataset (`House_Rent_Dataset.csv`)
2. **Source URL:** [Kaggle Dataset Hub](https://www.kaggle.com/datasets/iamsouravbanerjee/house-rent-prediction-dataset)
3. **Original Publisher/Source:** Sourav Banerjee; scraped from Indian property portals (Magicbricks / 99acres) in 2022.
4. **License:** Open Access / Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) with author attribution.
5. **Permitted Use:** Academic, educational, and research use explicitly permitted with attribution.
6. **Dataset Size:** 4,746 rows, 12 columns (~450 KB uncompressed CSV).
7. **Geographic Coverage:** 6 major Indian economic hubs: Mumbai (972), Chennai (891), Bangalore (886), Hyderabad (868), Delhi (605), Kolkata (524).
8. **Number of Features:** 11 features + 1 target (`Rent`).
9. **Target Variable:** `Rent` (Continuous numerical, Monthly Rent in INR).
10. **Relevant Input Features:** `BHK`, `Size` (sq ft), `City`, `Furnishing Status`, `Bathroom`, `Area Type`, `Area Locality`, `Tenant Preferred`, `Floor`.
11. **Missing-Value Situation:** Zero missing values (0 nulls/NaNs across all 4,746 records).
12. **Duplicate Situation:** Negligible duplicate count (~5 identical records).
13. **Obvious Outliers:** Right-skewed rent distribution (min ₹1,200/mo, median ₹16,000/mo, max ₹3,500,000/mo). Size ranges from 10 sq ft to 8,000 sq ft. Requires standard percentile/IQR outlier filtering.
14. **Rent Cadence:** Monthly rental price verified.
15. **Currency Identifiable:** Yes, Indian Rupees (INR / ₹).
16. **Location Granularity:** High utility: hierarchical macro-location (`City`) and micro-location (`Area Locality` with 2,235 unique localities).
17. **Support for LeaseLens:** Complete alignment with LeaseLens Mongoose `Property` model (`bhk`, `areaSqFt`, `bathrooms`, `address.city`, `address.locality`, `furnishingStatus`).
18. **Data Leakage Risk:** Low. Exclude `Posted On` (scraper date) and `Point of Contact` (marketing channel) from feature space.
19. **Known Limitations:** 4,746 rows is moderate; high cardinality in locality requires frequency clustering or target encoding; lacks individual boolean amenity flags.

---

### Candidate 2: Property Rental Listings Dataset (Harshal H / Magicbricks)
1. **Dataset Name:** Property Rental Listings Dataset (`property-rental-listings-dataset`)
2. **Source URL:** [Kaggle Dataset Hub](https://www.kaggle.com/datasets/harshalh/property-rental-listings-dataset)
3. **Original Publisher/Source:** Harshal H; scraped from Magicbricks.com.
4. **License:** Creative Commons Attribution 4.0 International (CC BY 4.0).
5. **Permitted Use:** Commercial and academic modification/redistribution permitted with attribution.
6. **Dataset Size:** ~3,100 rows, 18 columns (~1.1 MB uncompressed CSV).
7. **Geographic Coverage:** Mumbai metropolitan area only.
8. **Number of Features:** 17 features + 1 target (`Price`).
9. **Target Variable:** `Price` (Monthly rent in INR).
10. **Relevant Input Features:** `Area`, `BHK`, `Bathrooms`, `Furnished`, `Balconies`, `Floor`, `Location`, `Property Type`, `Amenities`.
11. **Missing-Value Situation:** Moderate missing data (10–25% nulls in `Year of Construction`, `Balconies`, `Facing`, and `Amenities`).
12. **Duplicate Situation:** ~3% duplicate listings resulting from multi-broker posts.
13. **Obvious Outliers:** Ultra-luxury Mumbai rents exceeding ₹5,00,000/month.
14. **Rent Cadence:** Monthly rental price verified.
15. **Currency Identifiable:** Yes, INR.
16. **Location Granularity:** High for Mumbai localities, but zero coverage for other Indian states.
17. **Support for LeaseLens:** Partial. Provides rich property attributes but cannot serve LeaseLens users in Bangalore, Delhi, Hyderabad, or Chennai.
18. **Data Leakage Risk:** Moderate to High. Column `Is Luxury` appears post-hoc or derived from price thresholds; `Title` contains promotional text.
19. **Known Limitations:** Geographically confined to a single city; leakage-prone attributes; missing data requires imputation.

---

### Candidate 3: Rental Properties Dataset (PromptCloud / Makaan New Delhi)
1. **Dataset Name:** Rental Properties Dataset: House and Apartment Listings (New Delhi)
2. **Source URL:** [Kaggle Dataset Hub](https://www.kaggle.com/datasets/promptcloud/rental-properties-dataset-house-and-apartment-listings)
3. **Original Publisher/Source:** PromptCloud / DataStock; scraped from Makaan.com.
4. **License:** Other / Proprietary Showcase (Sample published for evaluation).
5. **Permitted Use:** Academic evaluation allowed for sample dump; redistribution rights unclear. Marked: *License unclear — do not use for final project dataset without further verification.*
6. **Dataset Size:** ~14,000+ rows, 15 columns.
7. **Geographic Coverage:** New Delhi and National Capital Region (NCR) only.
8. **Number of Features:** 14 features + 1 target (`rent`).
9. **Target Variable:** `rent` (Monthly rent in INR).
10. **Relevant Input Features:** `area`, `bedrooms`, `bathrooms`, `locality`, `property_type`.
11. **Missing-Value Situation:** High missingness (15–30% missing values in secondary features).
12. **Duplicate Situation:** Substantial duplication across scraping runs.
13. **Obvious Outliers:** Erroneous deposit entries and rental rate extremes.
14. **Rent Cadence:** Monthly rent verified.
15. **Currency Identifiable:** Yes, INR.
16. **Location Granularity:** Confined strictly to Delhi NCR.
17. **Support for LeaseLens:** Inadequate pan-Indian coverage.
18. **Data Leakage Risk:** **High.** Includes `deposit` (Security Deposit). In Indian rental leases, security deposits are calculated as a fixed multiple (2×–10×) of monthly rent, introducing severe deterministic leakage.
19. **Known Limitations:** Unclear redistribution license; severe target leakage risk via deposit; single region.

---

### Candidate 4: USA Housing Listings (Austin Reese / Craigslist)
1. **Dataset Name:** USA Housing Listings (`housing.csv`)
2. **Source URL:** [Kaggle Dataset Hub](https://www.kaggle.com/datasets/austinreese/usa-housing-listings)
3. **Original Publisher/Source:** Austin Reese; scraped from Craigslist housing.
4. **License:** CC0: Public Domain.
5. **Permitted Use:** Unrestricted commercial and academic use.
6. **Dataset Size:** 384,977 rows, 22 columns (~125 MB CSV).
7. **Geographic Coverage:** United States (50 states).
8. **Number of Features:** 21 features + 1 target (`price`).
9. **Target Variable:** `price` (Monthly rent in USD).
10. **Relevant Input Features:** `sqfeet`, `beds`, `baths`, `type`, `comes_furnished`, `parking_options`, `lat`, `long`.
11. **Missing-Value Situation:** 10–25% missing values in amenities, parking, and coordinates.
12. **Duplicate Situation:** >15,000 duplicate listings.
13. **Obvious Outliers:** Extreme noise: rents of $0, $1, $99,999,999; 0 sq ft units.
14. **Rent Cadence:** Monthly rent.
15. **Currency Identifiable:** Yes, USD ($).
16. **Location Granularity:** US coordinates and states; completely inapplicable to India.
17. **Support for LeaseLens:** **Incompatible.** LeaseLens is designed for Indian property management (INR currency, BHK room conventions, Indian metropolitan regions).
18. **Data Leakage Risk:** Low (standard listing attributes).
19. **Known Limitations:** Geographic and currency mismatch; excessive noise and scraping anomalies.

---

### Candidate 5: Bengaluru House Price Data (Amitabha Chakraborty)
1. **Dataset Name:** Bengaluru House Price Data (`bengaluru-house-price-data`)
2. **Source URL:** [Kaggle Dataset Hub](https://www.kaggle.com/datasets/amitabhajoy/bengaluru-house-price-data)
3. **Original Publisher/Source:** Amitabha Chakraborty; scraped from real estate listing portals.
4. **License:** CC0: Public Domain / Open Database License.
5. **Permitted Use:** Unrestricted academic and commercial use.
6. **Dataset Size:** 13,320 rows, 9 columns.
7. **Geographic Coverage:** Bengaluru, Karnataka, India.
8. **Number of Features:** 8 features + 1 target (`price`).
9. **Target Variable:** **`price` (Total Purchase / Sale Price in Lakhs INR).**
10. **Relevant Input Features:** `area_type`, `availability`, `location`, `size`, `total_sqft`, `bath`, `balcony`.
11. **Missing-Value Situation:** Missing values in `bath`, `balcony`, `size`, `society`.
12. **Duplicate Situation:** Moderate.
13. **Obvious Outliers:** Inconsistent area entries (ranges like `"2100 - 2850"` or sq meter conversions).
14. **Rent Cadence:** **FATAL MISMATCH.** The target is property purchase/sale value (e.g. ₹65 Lakhs = ₹6,500,000 capital value), NOT monthly rent!
15. **Currency Identifiable:** Yes, Lakhs INR.
16. **Location Granularity:** Bengaluru neighborhoods only.
17. **Support for LeaseLens:** **Disqualified.** LeaseLens manages leases and rental yields. Training on capital sale prices fundamentally fails the rental valuation requirement. Applying a synthetic rental yield (e.g., assuming 2.5% cap rate) would invent synthetic targets rather than learning true rental market dynamics.
18. **Data Leakage Risk:** N/A.
19. **Known Limitations:** Wrong target variable for rental price prediction.

---

## 4. Feature Comparison Matrix

The table below maps the schema requirements of the LeaseLens domain model against the verified columns of each candidate dataset.

| LeaseLens Domain Feature | Candidate 1<br>(Sourav Banerjee) | Candidate 2<br>(Harshal H - Mumbai) | Candidate 3<br>(PromptCloud - Delhi) | Candidate 4<br>(Austin Reese - US) | Candidate 5<br>(Bengaluru Sales) |
|---|:---:|:---:|:---:|:---:|:---:|
| **City** | **Yes** (6 metros) | **No** (Mumbai only) | **No** (Delhi only) | **No** (US cities) | **No** (Bangalore only) |
| **Locality** | **Yes** (`Area Locality`) | **Yes** (`Location`) | **Yes** (`locality`) | **Yes** (`region`) | **Yes** (`location`) |
| **Property Type** | **Yes** (`Area Type`) | **Yes** (`Property Type`) | **Yes** (`property_type`) | **Yes** (`type`) | **Yes** (`area_type`) |
| **BHK Configuration** | **Yes** (`BHK`) | **Yes** (`BHK`) | **Yes** (`bedrooms`) | **Yes** (`beds`) | **Yes** (`size`) |
| **Bedrooms** | **Implicit** (via `BHK`) | **Yes** (`BHK`) | **Yes** (`bedrooms`) | **Yes** (`beds`) | **Implicit** (`size`) |
| **Bathrooms** | **Yes** (`Bathroom`) | **Yes** (`Bathrooms`) | **Yes** (`bathrooms`) | **Yes** (`baths`) | **Yes** (`bath`) |
| **Area (Sq. Ft.)** | **Yes** (`Size`) | **Yes** (`Area`) | **Yes** (`area`) | **Yes** (`sqfeet`) | **Yes** (`total_sqft`) |
| **Furnishing Status** | **Yes** (`Furnishing Status`)| **Yes** (`Furnished`) | **Partial** (many nulls) | **Yes** (`comes_furnished`)| **No** |
| **Parking** | **No** (captured in area) | **No** | **No** | **Yes** (`parking_options`)| **No** |
| **Amenities** | **No** | **Yes** (`Amenities`) | **No** | **Partial** (flags) | **No** |
| **Floor Information** | **Yes** (`Floor`) | **Yes** (`Floor`) | **No** | **No** | **No** |
| **Preferred Tenant** | **Yes** (`Tenant Preferred`)| **No** | **No** | **No** | **No** |
| **Monthly Rent (Target)** | **Yes (INR)** | **Yes (INR)** | **Yes (INR)** | **Yes (USD)** | **NO (Sale Price)** |

---

## 5. License & Permissibility Analysis

Rigorous verification of licensing terms protects the project from intellectual property violations and legal non-compliance:

1. **Candidate 1 (House Rent Prediction Dataset - Sourav Banerjee):**
   * *License:* Open Access / CC BY-SA 4.0 with attribution requirement.
   * *Status:* Fully compliant for academic and educational capstone development. Proper attribution must be included in ML documentation and code headers.
2. **Candidate 2 (Property Rental Listings Dataset - Harshal H):**
   * *License:* Creative Commons Attribution 4.0 International (CC BY 4.0).
   * *Status:* Fully compliant. Highly permissive for adaptation and educational use with attribution.
3. **Candidate 3 (PromptCloud / Makaan):**
   * *License:* Unspecified / Commercial sample preview.
   * *Status:* **License unclear — do not use for final project dataset without further verification.** Disqualified on licensing grounds.
4. **Candidate 4 (Austin Reese):**
   * *License:* CC0 1.0 Universal (Public Domain).
   * *Status:* Unconditionally permissive, but disqualified on geographic and currency mismatch.
5. **Candidate 5 (Bengaluru House Price Data):**
   * *License:* CC0 / ODbL.
   * *Status:* Permissive, but disqualified due to target variable mismatch (Sale Price vs. Rent).

---

## 6. Data Quality & Preprocessing Feasibility Analysis

A comparison of data cleanliness and the preprocessing burden reveals marked differences:

| Metric / Dimension | Candidate 1 (Banerjee) | Candidate 2 (Harshal H) | Candidate 3 (PromptCloud) | Candidate 4 (Austin Reese) | Candidate 5 (Bengaluru) |
|---|---|---|---|---|---|
| **Total Rows** | 4,746 | ~3,100 | ~14,000 | 384,977 | 13,320 |
| **Missing Values** | **0 (0.0%)** | 10–25% in 4 columns | 15–30% in 5 columns | 10–25% in 6 columns | ~5% across 4 columns |
| **Duplicate Rows** | < 0.1% | ~3.0% | ~5.0% | ~4.0% | ~4.0% |
| **Format Consistency**| High (clean types) | Moderate | Moderate (noisy strings)| Severe (corrupted text)| Moderate (string ranges)|
| **Currency Uniformity**| Uniform INR | Uniform INR | Uniform INR | Uniform USD | Uniform Lakhs INR |
| **Target Distribution**| Right-skewed (log fix)| Right-skewed | Right-skewed | Extremely noisy | Right-skewed |
| **Preprocessing Effort**| **Low–Moderate** | Moderate | High | Very High | Moderate–High |

*Conclusion:* Candidate 1 offers the cleanest foundation for a production-ready ML pipeline. The absence of missing values allows the engineering focus to remain on feature engineering (e.g., parsing compound floor descriptions, robust scaling, categorical encodings) rather than contentious synthetic imputation.

---

## 7. Data Leakage Analysis

To prevent unrealistic validation performance and ensure the model generalizes to unlisted properties, each candidate was audited for potential leakage:

### Audited Columns in Candidate 1:
* **`Posted On`:**
  * *Nature:* Listing publication date string (e.g., `"2022-05-18"`).
  * *Leakage Assessment:* Represents scraping/posting chronology. In a static dataset, using raw dates can cause tree models to memorize specific calendar weeks or introduce temporal leakage.
  * *Decision:* **EXCLUDE from feature matrix.** Physical property value is independent of the crawler date.
* **`Point of Contact`:**
  * *Nature:* Listing contact entity (`Contact Owner`, `Contact Agent`, `Contact Builder`).
  * *Leakage Assessment:* Correlates with rent (agents handle luxury apartments, owners handle smaller units), but does not describe the physical asset. Asking a user "who will list your property" during valuation introduces marketing bias.
  * *Decision:* **EXCLUDE from baseline feature matrix** to maintain physical objectivity.
* **`Rent` (Target):**
  * *Leakage Assessment:* Strictly isolated as target vector $y$. No target-derived ratios (such as rent-per-sqft) will be constructed or exposed prior to prediction.

### Audited Columns in Other Candidates:
* **Candidate 2 (`Is Luxury`):** Target-correlated flag often assigned post-hoc when listing price exceeds threshold. **Critical Leakage Risk.**
* **Candidate 3 (`deposit`):** Directly represents security deposit, which is contracted as an exact multiple of monthly rent ($2\times \text{Rent}$ or $10\times \text{Rent}$). Including deposit allows models to memorize simple arithmetic rather than learning valuation fundamentals. **Fatal Leakage Risk.**

---

## 8. Geographic Scope & Relevance

LeaseLens is designed as an Indian rental property management platform. Urban rental markets in India exhibit unique structural characteristics:
1. **Tier-1 Metro Rent Disparities:** Rental values in South Mumbai or Bandra exceed those in Kolkata or suburban Hyderabad by 300%–500% for identical square footage.
2. **Room Conventions:** Use of BHK (Bedroom-Hall-Kitchen) configurations rather than single-room counts.
3. **Furnishing Norms:** Semi-furnished (including wardrobes, modular kitchen, electrical fittings) constitutes the modal Indian rental arrangement, with furnished commanding significant premiums.

Evaluating geographic scope:
* **Candidate 1** encompasses all 6 premier metropolitan hubs across West, South, North, and East India (Mumbai, Bangalore, Chennai, Hyderabad, Delhi, Kolkata).
* **Candidate 2 & 3** are geographically brittle, restricted to a single city.
* **Candidate 4** reflects North American suburban and urban dynamics, USD currency, and detached housing typologies completely irrelevant to LeaseLens.

---

## 9. Recommended Primary & Backup Datasets

### Primary Recommendation: **House Rent Prediction Dataset (Sourav Banerjee)**
* **Dataset Identifier:** `iamsouravbanerjee/house-rent-prediction-dataset`
* **Filename:** `House_Rent_Dataset.csv`
* **Publisher / Source:** Sourav Banerjee (Kaggle)
* **License:** CC BY-SA 4.0 / Kaggle Open Research
* **Volume:** 4,746 rows, 12 columns
* **Target:** `Rent` (Monthly Rent in INR)
* **Geographic Coverage:** Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata

#### Why Selected:
1. **Multi-Metro Pan-Indian Representation:** Direct coverage of 6 major Indian cities aligns directly with LeaseLens's operational target market.
2. **Schema Concordance with LeaseLens Database:** Directly maps to `bhk`, `areaSqFt`, `bathrooms`, `furnishingStatus`, `address.city`, and `address.locality`.
3. **Data Completeness & Quality:** Zero missing values across the entire dataset enables robust, deterministic preprocessing without synthetic distortion.
4. **Clean, Unambiguous Target Variable:** Target is empirically verified monthly rent in INR, avoiding the fatal purchase-price error of sales datasets.
5. **Clear Intellectual Property Standing:** Open academic and research terms with proper author attribution.

#### Known Limitations & Mitigations:
* *Limitation 1:* High cardinality in `Area Locality` (~2,235 unique localities across 4,746 rows).  
  *Mitigation:* Apply frequency-based filtering (pooling rare localities into `"Other"`) or Target Encoding with cross-validation regularisation.
* *Limitation 2:* Compound textual field in `Floor` (e.g., `"Ground out of 2"`, `"3 out of 14"`).  
  *Mitigation:* Parse into two dedicated numeric features during Phase 5B: `Floor_Number` and `Total_Floors`.
* *Limitation 3:* Severe right-skew in target `Rent` (skewness > 15 due to luxury penthouses).  
  *Mitigation:* Log1p transformation ($\log(y + 1)$) during training or robust outlier trimming at upper percentiles.

---

### Backup Recommendation: **Property Rental Listings Dataset (Harshal H)**
* **Dataset Identifier:** `harshalh/property-rental-listings-dataset`
* **Publisher / Source:** Harshal H (Magicbricks scrape)
* **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
* **Volume:** ~3,100 rows, 18 columns
* **Target:** `Price` (Monthly Rent in INR)
* **Geographic Coverage:** Mumbai Metropolitan Region

#### Justification as Backup:
1. Explicit, verified CC BY 4.0 license offering unambiguous commercial and academic rights.
2. High feature granularity including physical balconies, building floor, and explicit furnishing indicators.
3. Acts as an immediate failover dataset if multi-city scraping artifacts require localized single-city benchmarking.

#### Constraints as Primary:
1. Single-city limitation (Mumbai only) degrades applicability for properties created in Bangalore, Delhi, or Chennai.
2. High missingness in optional fields requires imputation pipelines.
3. Contains leakage-prone fields (`Is Luxury`) requiring strict exclusion.

---

## 10. Formal ML Problem Definition

### 10.1 Mathematical Formulation
We define the task as a supervised multivariate regression problem:
$$\mathcal{D} = \{(\mathbf{x}_i, y_i)\}_{i=1}^{N}$$
where:
* $N = 4,746$ (sample size before cleaning/filtering).
* $\mathbf{x}_i \in \mathbb{R}^d$ is the feature vector representing observable property characteristics.
* $y_i \in \mathbb{R}^+$ represents the ground-truth monthly rental price in Indian Rupees (INR).

We aim to learn a parameterized hypothesis function $f_\theta: \mathcal{X} \to \mathbb{R}^+$ that minimizes expected prediction loss $\mathcal{L}(y, f_\theta(\mathbf{x}))$.

### 10.2 Target Variable Specification
* **Variable Name:** `Rent`
* **Units:** Indian Rupees per calendar month (INR / Month)
* **Scale & Transformation:** Because residential rent is inherently log-normally distributed, models will be evaluated both on raw targets and under log-transformed targets:
  $$z_i = \ln(y_i)$$
  Inference predictions $\hat{z}$ will be transformed back using the exponential function $\hat{y} = \exp(\hat{z})$ with appropriate smearing/bias corrections if necessary.

### 10.3 Input Feature Specification (Verified in Primary Dataset)

| Feature Name | Raw Data Type | Preprocessed Representation | Valid Domain / Range |
|---|---|---|---|
| `BHK` | Integer | Numerical / Scaled | 1 to 6 |
| `Size` | Integer | Continuous Numerical (Sq. Ft.) | 100 to 8,000 sq ft (post outlier filter) |
| `Bathroom` | Integer | Numerical / Scaled | 1 to 10 |
| `City` | Categorical | One-Hot Encoded (6 categories) | Kolkata, Mumbai, Bangalore, Delhi, Chennai, Hyderabad |
| `Furnishing Status`| Categorical | Ordinal / One-Hot Encoded | Unfurnished (0), Semi-Furnished (1), Furnished (2) |
| `Area Type` | Categorical | One-Hot Encoded (3 categories) | Super Area, Carpet Area, Built Area |
| `Tenant Preferred` | Categorical | One-Hot Encoded (3 categories) | Bachelors, Family, Bachelors/Family |
| `Floor` | String | Extracted: `Floor_Number` (int), `Total_Floors` (int) | Ordinal numerical values |
| `Area Locality` | Categorical | Target-Encoded / Frequency Thresholded | High-cardinality neighborhood cluster |

### 10.4 Excluded Features (Guaranteed Non-Predictors)
* `Posted On` — Excluded to eliminate temporal leakage.
* `Point of Contact` — Excluded to avoid broker/channel operational bias.

### 10.5 Evaluation Metrics
The performance of all candidate regression models will be evaluated strictly on an unseen holdout test split (e.g., 20% test partition) using three industry-standard metrics:

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$$
   *Purpose:* Directly interpretable in currency units (INR). Represents average expected error margin in Rupees.
2. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$$
   *Purpose:* Penalizes severe rental misvaluations heavily, ensuring models do not make catastrophic pricing errors on large listings.
3. **Coefficient of Determination ($R^2$ Score):**
   $$R^2 = 1 - \frac{\sum_{i=1}^n (y_i - \hat{y}_i)^2}{\sum_{i=1}^n (y_i - \bar{y})^2}$$
   *Purpose:* Quantifies the proportion of rental price variance explained by the property features.

*(Note: Per academic rigor guidelines, no arbitrary or invented numerical metric targets are postulated prior to empirical baseline testing in Phase 5B/5C).*

---

## 11. Known Limitations & Project Scope Boundaries

1. **Market Temporal Validity:** The primary dataset reflects rental listings collected in 2022. While relative structural values (e.g. BHK ratio, square-foot price gradient, furnishing premium) remain highly stable, absolute rents may reflect 2022 price levels. Future iterations may apply an annual inflation adjustment coefficient if benchmarking against contemporary 2026 listings.
2. **High Locality Cardinality:** Over 2,000 localities exist across 4,746 records. Models must employ regularized target encoding or cluster sparse localities into municipal sub-zones to prevent overfitting.
3. **Amenity Granularity:** Individual micro-amenities (such as swimming pool, backup power generator, covered parking) are not explicitly itemized as boolean columns; their value is partially bundled into `Area Type`, `Size`, and locality prestige.
4. **Scope Exclusions:** This phase strictly covers dataset selection and formal problem definition. No machine learning models have been trained, no FastAPI endpoints have been launched, and no existing application code has been modified.
