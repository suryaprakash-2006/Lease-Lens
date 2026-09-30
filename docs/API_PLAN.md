# LeaseLens — REST API Specification Plan

All API endpoints are prefixed with `/api/v1`. Protected routes require the header `Authorization: Bearer <JWT_TOKEN>`.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new user account with email and password |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT token + user profile |
| `GET` | `/api/v1/auth/me` | Protected | Fetch currently authenticated user's profile |
| `PUT` | `/api/v1/auth/profile` | Protected | Update profile (name, phone, password change) |

---

## 2. Properties Endpoints (`/api/v1/properties`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/properties` | Protected | List properties with query filters (`search`, `city`, `bhk`, `status`, `page`, `limit`) |
| `POST` | `/api/v1/properties` | Protected | Create a new property |
| `GET` | `/api/v1/properties/:id` | Protected | Get single property details (including active lease & expenses summary) |
| `PUT` | `/api/v1/properties/:id` | Protected | Update property attributes |
| `DELETE` | `/api/v1/properties/:id` | Protected | Delete property (safeguarded: rejected if active lease exists) |

---

## 3. Leases Endpoints (`/api/v1/leases`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/leases` | Protected | List all leases with filters (`status`, `propertyId`, `expiringSoon=true`) |
| `POST` | `/api/v1/leases` | Protected | Create new lease agreement for a property |
| `GET` | `/api/v1/leases/:id` | Protected | Get detailed lease agreement info |
| `PUT` | `/api/v1/leases/:id` | Protected | Update lease terms or status |
| `PATCH` | `/api/v1/leases/:id/status` | Protected | Transition status (`Active`, `Terminated`, etc.) |
| `DELETE` | `/api/v1/leases/:id` | Protected | Delete or archive lease record |

---

## 4. Expenses Endpoints (`/api/v1/expenses`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/expenses` | Protected | List logged expenses with query filters (`propertyId`, `category`, `month`, `year`) |
| `POST` | `/api/v1/expenses` | Protected | Log a new expense |
| `GET` | `/api/v1/expenses/summary` | Protected | Aggregated monthly totals and category breakdown |
| `GET` | `/api/v1/expenses/:id` | Protected | Get single expense entry |
| `PUT` | `/api/v1/expenses/:id` | Protected | Update an expense record |
| `DELETE` | `/api/v1/expenses/:id` | Protected | Delete an expense record |

---

## 5. Dashboard Endpoints (`/api/v1/dashboard`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/metrics` | Protected | Key KPI cards: total properties, active leases, monthly rent, total expenses |
| `GET` | `/api/v1/dashboard/upcoming-events` | Protected | Leases expiring within 30 days or pending notice periods |
| `GET` | `/api/v1/dashboard/expense-chart` | Protected | Time-series and categorical chart breakdown data |
| `GET` | `/api/v1/dashboard/recent-activity` | Protected | Recent portfolio events feed |

---

## 6. Machine Learning Endpoints (`/api/v1/predictions` and ML Service)

### Node.js Backend Proxy
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/predictions/predict-rent` | Protected | Validates input features, calls FastAPI ML service, logs prediction to DB, returns response |
| `GET` | `/api/v1/predictions/history` | Protected | Retrieve historical predictions executed by the user |

### FastAPI ML Microservice (Direct internal endpoint on Port 8000)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Internal | ML service health check and loaded model version info |
| `POST` | `/predict/rent` | Internal | Executes preprocessing pipeline & returns estimated rental price |

#### Example Request Payload (`POST /api/v1/predictions/predict-rent`):
```json
{
  "city": "Chennai",
  "locality": "Velachery",
  "property_type": "Apartment",
  "bhk": 2,
  "area_sqft": 1150,
  "bathrooms": 2,
  "furnishing_status": "Semi-Furnished",
  "parking": true
}
```

#### Example Standard Response:
```json
{
  "success": true,
  "data": {
    "predicted_rent": 19500,
    "currency": "INR",
    "range": {
      "lower": 18200,
      "upper": 20800
    },
    "model_metadata": {
      "model_type": "RandomForestRegressor",
      "version": "1.0.0"
    }
  }
}
```

---

## 7. Standardized Error Response Format
All errors return consistent JSON payloads:
```json
{
  "success": false,
  "error": "ResourceNotFound",
  "message": "Property with ID 650a... not found",
  "statusCode": 404
}
```
Validation errors return a `details` array containing field-specific errors.
