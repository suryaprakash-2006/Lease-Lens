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

## Phase 1: Backend Infrastructure & Authentication (Completed)
* [x] Setup Node.js + Express project in `backend/` with ESLint and environment configs.
* [x] Configure MongoDB connection with Mongoose and connection health-checks.
* [x] Implement User model and password hashing via bcrypt.
* [x] Implement JWT token generation, verification middleware, and protected route handlers.
* [x] Build centralized error handling middleware and request logging.
* [x] Unit / integration tests for `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me`.

---

## Phase 2: Domain REST APIs & Business Logic (Completed)
* [x] **Properties API**:
  * [x] Create, Read, Update, Delete with ownership isolation.
  * [x] Search by text and filter by city, BHK, status, furnishing status.
* [x] **Leases API**:
  * [x] Lease lifecycle logic: status computation (`Active`, `Upcoming`, `Expired`, `Terminated`).
  * [x] Upcoming expiration queries (<= 30 days).
  * [x] Property ownership verification and active lease deletion safeguards.
* [x] **Expenses API**:
  * [x] Categorized expense logging and MongoDB aggregation pipeline for summary metrics.
* [x] **Dashboard API**:
  * [x] Consolidated aggregation endpoints for KPI metrics, upcoming lease events, expense charts, and recent activity feed.
* [x] **Comprehensive Automated Test Suite**:
  * [x] 70 integration tests in `test_phase2.js` verifying CRUD, multi-tenant isolation, and validation.

---

## Phase 3: Frontend Foundations & Design System (Completed)
* [x] Setup React + Vite in `frontend/` with React Router v6 and Bootstrap Icons.
* [x] Establish modern CSS design system tokens (palette, typography, cards, buttons, status badges) adhering to clean SaaS aesthetics.
* [x] Implement Auth Context and centralized API service layer with JWT interceptors.
* [x] Build core application layout: responsive sidebar navigation, header, user profile area, and protected route wrappers.
* [x] Implement Landing, Authentication pages (`/login`, `/register`), and page shells (`/dashboard`, `/properties`, `/leases`, `/expenses`, `/profile`).
* [x] Automated frontend API integration testing suite (`test_frontend_integration.js`).

---

## Phase 4: Frontend Feature Modules (Completed)
* [x] **Dashboard Page (`/dashboard`)**: Real-time KPI metric cards, upcoming lease expiration alerts, expense distribution progress bars, and recent activity audit trail.
* [x] **Property Management (`/properties`, `/properties/new`, `/properties/:id`, `/properties/:id/edit`)**: Search & filter grid/list, full CRUD forms, unit specifications, amenity selector, and active lease deletion safeguards.
* [x] **Lease Management (`/leases`, `/leases/new`, `/leases/:id`, `/leases/:id/edit`)**: User-owned property selector, automatic rent/deposit prefilling, lease agreement lifecycle transitions (`Active`, `Upcoming`, `Expired`, `Terminated`), and date validations.
* [x] **Expense Tracker (`/expenses`)**: Expense log table, filter by property and category, quick-add/edit modal, delete confirmations, and financial summary cards.
* [x] **Profile Page (`/profile`)**: User account details update, password change verification, and notification toasts.
* [x] **Automated Frontend CRUD & Integration Verification Suite**: 44 automated tests in `frontend/test_frontend_crud.js` (158 tests total across project).

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
