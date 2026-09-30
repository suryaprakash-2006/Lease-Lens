# LeaseLens — Development Roadmap

The development of LeaseLens is structured into phased increments to guarantee stability, testability, and academic defensibility at each checkpoint.

---

## Phase 0: Planning & Architectural Foundations (Current)
* [x] Inspect workspace and initialize repo structure.
* [x] Formulate System Architecture document.
* [x] Define Functional and Non-Functional Requirements.
* [x] Design MongoDB Database Schema and Indexing Strategy.
* [x] Draft RESTful API Plan.
* [x] Draft Machine Learning Integration Plan.
* [x] Compile root README and development guidelines.
* [ ] Align with project stakeholders / user on design decisions before code generation.

---

## Phase 1: Backend Infrastructure & Authentication
* Setup Node.js + Express project in `backend/` with ESLint and environment configs.
* Configure MongoDB connection with Mongoose and connection health-checks.
* Implement User model and password hashing via bcrypt.
* Implement JWT token generation, verification middleware, and protected route handlers.
* Build centralized error handling middleware and request logging.
* Unit / integration tests for `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me`.

---

## Phase 2: Domain REST APIs & Business Logic
* **Properties API**:
  * Create, Read, Update, Delete with ownership isolation.
  * Search by text and filter by city, BHK, status.
* **Leases API**:
  * Lease lifecycle logic: status computation (`Active`, `Upcoming`, `Expired`, `Terminated`).
  * Upcoming expiration queries (<= 30 days).
* **Expenses API**:
  * Categorized expense logging and monthly aggregation pipeline.
* **Dashboard API**:
  * Consolidated aggregation endpoint for KPI metrics, upcoming lease events, and monthly spending.

---

## Phase 3: Frontend Foundations & Design System
* Setup React + Vite in `frontend/` with React Router v6.
* Establish modern CSS design system tokens (palette, typography, cards, buttons) adhering to clean SaaS aesthetics.
* Implement Auth Context and Axios/Fetch API service client with interceptors for JWT tokens.
* Build core application layout: responsive sidebar navigation, header, user profile dropdown, and protected route wrappers.
* Implement Authentication pages: `/login`, `/register`, `/profile`.

---

## Phase 4: Frontend Feature Modules
* **Dashboard Page (`/dashboard`)**: KPI metric cards, upcoming deadlines widget, expense breakdown chart, and recent activity feed.
* **Property Management (`/properties`)**: Portfolio grid/table, add property modal/form, property detail view with linked active lease, edit/delete actions.
* **Lease Management (`/leases`)**: Lease agreement builder, status badges, lease detail modal, termination workflow.
* **Expense Tracker (`/expenses`)**: Expense log table, filter by month/category, quick-add expense modal, total cost calculations.

---

## Phase 5: Machine Learning Research & Service
* Identify and acquire suitable rental housing dataset.
* Conduct Exploratory Data Analysis (EDA) and document findings in Jupyter Notebook.
* Build preprocessing pipeline (encoding, scaling, imputation).
* Train and benchmark candidate algorithms: Linear Regression, Random Forest, XGBoost using MAE, RMSE, and R².
* Serialize optimal model pipeline.
* Build and containerize/script FastAPI service in `ml/` with `/predict/rent` endpoint.
* Wire Node.js backend proxy `/api/v1/predictions/predict-rent` to FastAPI service.
* Build Rental Price Predictor UI (`/predictions`) in React with instant feedback and comparison to listed rents.

---

## Phase 6: System Integration, Polish & Demonstration
* End-to-end integration testing of full flow: Register -> Add Property -> Create Lease -> Track Expense -> Predict Rent.
* Edge case handling (e.g. ML service offline graceful fallback, empty states, input boundary validations).
* Performance and UX polish (subtle animations, loading skeletons, responsive mobile views).
* Finalize project presentation documentation and demonstration script.
