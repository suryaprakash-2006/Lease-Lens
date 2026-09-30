# LeaseLens — System Architecture Document

## 1. System Overview

**LeaseLens** is an intelligent rental and lease management platform designed to unify property tracking, lease lifecycle management, expense monitoring, analytics, and machine-learning-driven rental price estimation.

```
                              CLIENT TIER
                     +---------------------------+
                     |       React + Vite        |
                     |  (Bootstrap / Modern CSS) |
                     +-------------+-------------+
                                   |
                             REST / HTTPS
                                   |
                                   v
                             BACKEND TIER
                     +---------------------------+
                     |    Node.js + Express      |
                     |  - JWT Auth & RBAC        |
                     |  - RESTful Controllers    |
                     |  - Business Logic Services|
                     |  - Input Validation       |
                     +-------------+-------------+
                                   |
                   +---------------+---------------+
                   |                               |
                   v                               v
             DATABASE TIER                     ML SERVICE
     +---------------------------+   +---------------------------+
     |      MongoDB Database     |   |       Python / FastAPI    |
     |   - User & Profile Data   |   |   - Rental Predictor API  |
     |   - Properties & Units    |   |   - scikit-learn / XGBoost|
     |   - Leases & Agreements   |   |   - Feature Pipelines     |
     |   - Expenses & Payments   |   +---------------------------+
     +---------------------------+
```

---

## 2. Component Breakdown & Responsibilities

### 2.1 Frontend Tier (`/frontend`)
* **Technology**: React 18+, Vite, React Router v6, Bootstrap / Modern CSS.
* **Responsibilities**:
  * Presentation layer with a clean SaaS-style responsive layout.
  * State management for authentication session, active filters, and form interactions.
  * Navigation and protected route guards (`/dashboard`, `/properties`, `/leases`, `/expenses`, `/predictions`).
  * Direct consumption of Node.js backend REST APIs via dedicated service modules (`services/api.js`, `services/authService.js`, etc.).
  * Dashboard visualizations (summary KPI cards, expense distribution charts, upcoming lease deadlines).
  * Feature input forms for ML rental estimation and interactive display of predicted rent ranges.

### 2.2 Backend API Tier (`/backend`)
* **Technology**: Node.js, Express.js (ES Modules / CommonJS structured), Mongoose ODM, JWT, bcrypt.
* **Responsibilities**:
  * Exposes centralized RESTful endpoints under `/api/v1/` prefix.
  * Stateless token-based authentication (`Authorization: Bearer <token>`) and authorization middleware.
  * Input sanitization and schema validation (e.g. Express-Validator or Joi/Zod) before passing to controllers.
  * Business logic orchestration:
    * Property CRUD & status tracking.
    * Lease lifecycle management (active, upcoming, expiring, terminated).
    * Expense categorization, aggregations, and net cash-flow calculations.
    * Forwarding rental prediction requests to the Python FastAPI microservice.
  * Centralized error handling and structured JSON responses `{ success: boolean, data?: any, error?: string, details?: any }`.

### 2.3 Data Storage Tier (`MongoDB`)
* **Technology**: MongoDB with Mongoose object modeling.
* **Responsibilities**:
  * Persistence of transactional application data:
    * `users`
    * `properties`
    * `leases`
    * `expenses`
    * `predictions` (audit log of ML queries made by users)
  * Referencing between documents (e.g. `lease.propertyId -> properties._id`, `expense.propertyId -> properties._id`).
  * Indexing on high-frequency lookup fields (`userId`, `status`, `propertyId`, `startDate`, `endDate`).

### 2.4 Machine Learning Microservice (`/ml`)
* **Technology**: Python 3.10+, FastAPI, Uvicorn, pandas, scikit-learn, joblib.
* **Responsibilities**:
  * Decoupled inference service hosted independently (e.g., port 8000).
  * Exposes `POST /predict/rent` endpoint accepting structured property feature payloads.
  * Encapsulates trained preprocessor pipeline (imputation, scaling, one-hot encoding).
  * Executes serialized ML model inference and returns point estimates along with confidence intervals / reference metadata.
  * Completely isolated from application database access (stateless inference).

---

## 3. Inter-Component Communication Protocols

| Source | Destination | Protocol / Format | Purpose | Security |
|---|---|---|---|---|
| Frontend (React) | Backend (Express) | HTTPS / JSON | User actions, queries, mutations | JWT in `Authorization` header |
| Backend (Express) | Database (MongoDB) | TCP / MongoDB Wire Protocol | Data persistence & aggregation | Authenticated connection string |
| Backend (Express) | ML Service (FastAPI) | HTTP / JSON (Internal) | Rental price predictions | Internal service URL / API key |

---

## 4. Security & Data Protection Principles

1. **Password Safety**: Hashes generated via `bcrypt` with appropriate salt rounds (10–12). No plaintext passwords ever stored or logged.
2. **Access Control**: Strict ownership checks (`req.user.id === resource.userId`) enforced at middleware/service layers for multi-tenant data safety.
3. **Environment Isolation**: Secrets (`JWT_SECRET`, `MONGO_URI`, `ML_SERVICE_URL`, `PORT`) managed via `.env` files and excluded from version control.
4. **Input Sanitization**: Whitelisting allowed fields on updates and validating data types to prevent NoSQL injection.
