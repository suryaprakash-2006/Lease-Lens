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

## Current Status: Phase 0 (Planning & Architecture)

All foundational architectural deliverables have been prepared and documented in the [`docs/`](./docs/) directory.
Review the documentation before proceeding to **Phase 1: Backend Infrastructure & Authentication**.
