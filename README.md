# LeaseLens — Intelligent Rental and Lease Management Platform

LeaseLens is an academic full-stack rental intelligence and lease management platform. It unifies property lifecycle operations, tenant lease tracking, expense monitoring, analytics, and empirical machine-learning rental price estimation into a modern SaaS dashboard.

---

## Architecture Overview

```
                         USER
                           |
                           v
                +---------------------+
                |   React + Vite      |
                |  Frontend Client    |
                +----------+----------+
                           |
                      REST / JSON
                           |
                           v
                +---------------------+
                | Node.js + Express   |
                |     Backend API     |
                +----------+----------+
                           |
              +------------+-------------+
              |                          |
              v                          v
       +-------------+           +---------------+
       |  MongoDB    |           | Python/FastAPI|
       |  Database   |           |  ML Service   |
       +-------------+           +-------+-------+
                                         |
                                         v
                                  +--------------+
                                  | Trained ML   |
                                  | Model        |
                                  +--------------+
```

---

## Repository Layout

```
LeaseLens/
│
├── frontend/             # React + Vite client application
├── backend/              # Node.js + Express REST API
├── ml/                   # Machine learning training pipeline & FastAPI service
│   ├── data/             # Raw and processed datasets (git-ignored)
│   ├── notebooks/        # EDA and model experiment notebooks
│   ├── src/              # Preprocessing, training, and API code
│   └── models/           # Serialized model pipelines (.joblib)
├── docs/                 # System documentation & specifications
│   ├── ARCHITECTURE.md   # Detailed component architecture & communication
│   ├── REQUIREMENTS.md   # Functional & non-functional requirements
│   ├── DATABASE_DESIGN.md# MongoDB schema design, collections & indexes
│   ├── API_PLAN.md       # Complete REST API route specifications
│   ├── ML_INTEGRATION_PLAN.md # ML dataset, evaluation & serving plan
│   └── ROADMAP.md        # Phased implementation plan
├── .gitignore            # Git ignore rules for Node, Python, and models
└── README.md             # Project documentation root
```

---

## Core Technology Stack

* **Frontend**: React (Vite), React Router v6, Bootstrap / Modern CSS
* **Backend**: Node.js, Express.js, JWT, bcrypt, REST API
* **Database**: MongoDB with Mongoose ODM
* **Machine Learning**: Python 3.10+, FastAPI, pandas, NumPy, scikit-learn, XGBoost

---

## Current Status: Phase 4 (Complete Frontend Feature Modules Complete)
 
- Phase 0 (Planning & Architectural Foundations): Completed
- Phase 1 (Backend Infrastructure & JWT Authentication): Completed & Verified (29 automated tests passing)
- Phase 2 (Domain REST APIs: Properties, Leases, Expenses, Dashboard): Completed & Verified (70 automated tests passing)
- Phase 3 (React + Vite Frontend Foundations & Auth Context): Completed & Verified (15 automated tests passing)
- Phase 4 (Complete Frontend Feature Modules: Dashboard, Properties, Leases, Expenses, Profile): Completed & Verified (44 automated tests passing)
- **Total Verification**: 158 automated tests passing across full stack (0 failures)

Next: **Phase 5: Machine Learning Research, Model Training, Evaluation, and FastAPI Inference Service**.
