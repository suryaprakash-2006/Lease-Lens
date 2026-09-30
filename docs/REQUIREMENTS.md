# LeaseLens — Requirements Specification

## 1. Functional Requirements (FR)

### Module 1: Authentication & User Management
* **FR-1.1 (Registration)**: System shall allow new users to register with name, email, password, and optional contact info.
* **FR-1.2 (Password Security)**: Passwords must be hashed using bcrypt prior to database insertion.
* **FR-1.3 (Authentication)**: System shall authenticate users via email and password, issuing a signed JWT upon success.
* **FR-1.4 (Session Protection)**: Protected routes on both frontend and backend must require a valid JWT. Expired or invalid tokens must prompt re-authentication.
* **FR-1.5 (Profile)**: Users shall be able to view and update their profile details and change passwords.
* **FR-1.6 (Logout)**: Client-side token invalidation and state reset.

### Module 2: Property Management
* **FR-2.1 (Property Creation)**: Users shall create properties with title, type (Apartment, Independent House, Villa, Studio), address, city, locality, BHK, area (sq. ft.), bedrooms, bathrooms, furnishing status, parking, amenities, listed rent, and initial status (`Available`, `Rented`, `Under Maintenance`).
* **FR-2.2 (Property Listing & Search)**: Users shall view their portfolio with keyword search (title, locality, address) and filtering (city, BHK, furnishing, status).
* **FR-2.3 (Property Details & Edit)**: Users shall view detailed property records and update attributes.
* **FR-2.4 (Property Deletion)**: Users shall delete properties with safeguard checks (prevent deletion if active leases are attached).

### Module 3: Lease Lifecycle Management
* **FR-3.1 (Lease Creation)**: Users shall create a lease linking a property to tenant details (name, contact email/phone), monthly rent, security deposit, start date, end date, notice period (days), status (`Active`, `Upcoming`, `Expired`, `Terminated`), and important clauses/notes.
* **FR-3.2 (Status Computation)**: System shall compute and reflect lease status dynamically based on current date, start date, and end date.
* **FR-3.3 (Upcoming Events Notification)**: System shall flag upcoming events: leases expiring in <= 30 days or notice period deadlines.
* **FR-3.4 (Lease History & Edit)**: Full historical record of previous leases per property with edit and termination capabilities.

### Module 4: Expense & Cash-Flow Tracking
* **FR-4.1 (Expense Logging)**: Users shall log expenses tied to a specific property (or general portfolio) with category (`Maintenance`, `Electricity`, `Water`, `Internet`, `Repairs`, `Taxes`, `Other`), amount, date, and description.
* **FR-4.2 (Expense Breakdown)**: Calculation of total monthly expenses, cumulative expenses, and category distributions.
* **FR-4.3 (Financial Calculations)**: Transparent display of:
  * Total Monthly Fixed Costs = Rent (for tenant view) or Maintenance/Utilities (for landlord view).
  * Initial Move-in Cost = Security Deposit + First Month Rent + Brokerage/Setup fees.
  * Net Cash Flow (if landlord tracking rental income vs. expenses).

### Module 5: Analytics & Centralized Dashboard
* **FR-5.1 (Metric Cards)**: Aggregate counts of Total Properties, Active Leases, Monthly Rental Revenue/Cost, and Total Active Expenses.
* **FR-5.2 (Upcoming Deadlines Alert Box)**: Visual alert cards for leases expiring soon or pending renewals.
* **FR-5.3 (Visual Charts)**: Expense distribution by category and property status breakdown.
* **FR-5.4 (Recent Activity)**: Chronological stream of recent property additions, lease updates, and logged expenses.

### Module 6: Machine Learning Rental Price Estimation
* **FR-6.1 (Prediction Input)**: Dedicated UI allowing users to input property features (City, Locality, BHK, Area, Bathrooms, Furnishing, Parking).
* **FR-6.2 (Inference Dispatch)**: Node.js backend validates payload and sends request to Python FastAPI ML service.
* **FR-6.3 (Result Display)**: Estimated monthly rent returned and presented with benchmark comparison (e.g. versus user's listed rent).
* **FR-6.4 (Prediction Audit History)**: Optional save/log of past predictions for user reference.

---

## 2. Non-Functional Requirements (NFR)

### NFR-1: Maintainability & Modularity
* High cohesion and low coupling across frontend components, backend services, and ML inference code.
* Strict layer separation: Controllers handling HTTP transport, Services handling business rules, Models handling schema definitions.

### NFR-2: Performance & Latency
* Standard API response times < 200ms for typical database queries under standard load.
* ML model inference response time < 500ms from request to response.
* Lightweight frontend bundle with lazy-loaded routes via React Router.

### NFR-3: Security & Data Integrity
* Multi-tenancy safety: Database queries must always scope data by authenticated `userId`.
* No sensitive credentials in client-side code; all secrets loaded from `.env`.
* Protection against standard vulnerabilities (XSS, NoSQL injection, CORS policies).

### NFR-4: Usability & Accessibility
* Clean, professional SaaS dashboard design with responsive layout spanning desktop, tablet, and mobile displays.
* Form validation feedback providing actionable, user-friendly error messages.

### NFR-5: Demonstrability & Academic Rigor
* Every component must have a clear architectural justification.
* Codebase structured for clear code walkthroughs during academic evaluations and project defenses.
