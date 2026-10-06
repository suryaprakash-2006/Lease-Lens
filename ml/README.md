# LeaseLens — Machine Learning Service & Pipeline

This directory contains the machine learning assets, data pipelines, training scripts, and inference microservice for **LeaseLens**.

---

## Directory Layout

```
ml/
├── data/
│   ├── raw/               # Raw untouched datasets (git-ignored, .gitkeep preserved)
│   └── processed/         # Cleaned, encoded, and partitioned datasets (git-ignored)
├── notebooks/             # Jupyter notebooks for exploratory data analysis and research
│   └── .gitkeep
├── src/                   # Python production modules for preprocessing, training, and API
│   └── .gitkeep
├── models/                # Serialized model pipelines and metadata (git-ignored)
│   └── .gitkeep
└── README.md              # Machine learning workflow documentation
```

---

## Selected Primary Dataset

* **Dataset Name:** House Rent Prediction Dataset
* **Source:** Kaggle (`iamsouravbanerjee/house-rent-prediction-dataset`)
* **File:** `House_Rent_Dataset.csv`
* **License:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
* **Author / Attribution:** Sourav Banerjee
* **Sample Count:** 4,746 listings across 6 Indian Metropolitan Cities (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata)
* **Target:** Monthly Rent in INR (`Rent`)

For detailed research and evaluation of all candidate datasets, see [`docs/ML_DATASET_RESEARCH.md`](../docs/ML_DATASET_RESEARCH.md).

---

## Data Acquisition & Setup (Reproducible Instructions)

Raw datasets and large serialized models are excluded from version control via `.gitignore` to keep the repository lightweight.

### 1. Manual Download from Kaggle:
1. Navigate to the dataset page: [House Rent Prediction Dataset on Kaggle](https://www.kaggle.com/datasets/iamsouravbanerjee/house-rent-prediction-dataset).
2. Download `House_Rent_Dataset.csv`.
3. Place the downloaded file into `ml/data/raw/House_Rent_Dataset.csv`.

### 2. Automated Download via Kaggle CLI:
```bash
# Ensure Kaggle API credentials (~/.kaggle/kaggle.json) are configured
kaggle datasets download -d iamsouravbanerjee/house-rent-prediction-dataset -p ml/data/raw/ --unzip
```

---

## Phase Roadmap

* **Phase 5A (Current):** ML Dataset Research & Problem Definition — Research complete, dataset selected, formal problem defined.
* **Phase 5B (Next):** Data Preprocessing & Exploratory Data Analysis (EDA) — Cleaning, parsing compound columns, log transformation, train/test split.
* **Phase 5C:** Model Training & Evaluation — Linear baseline, Random Forest, Gradient Boosting, evaluation with MAE, RMSE, and R².
* **Phase 5D:** FastAPI Microservice Implementation — Pydantic request validation, model loading, `/predict/rent` endpoint.
* **Phase 5E:** Node.js Backend Gateway Integration — Express proxying with timeouts, fallbacks, and audit logging.
* **Phase 5F:** React Frontend Prediction UI — Interactive valuation calculator and property pricing advisor.
