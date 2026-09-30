# LeaseLens — Database Design Document

## 1. Overview
The database layer uses **MongoDB** with **Mongoose ODM**. The schema design balances normalization (relational clarity via references) with performance (embedded sub-documents for lightweight arrays such as amenities or terms).

---

## 2. Entity-Relationship Summary

```
   +---------------+
   |     User      |
   +-------+-------+
           | 1
           |
           +-----------------------+-----------------------+
           | N                     | N                     | N
           v                       v                       v
   +---------------+       +---------------+       +---------------+
   |   Property    |<------+     Lease     |       |    Expense    |
   +---------------+ 1   N +---------------+       +---------------+
           ^                                               |
           | 1                                             | N
           +-----------------------------------------------+
```

---

## 3. Collections & Schemas

### 3.1 `users` Collection
Stores registered user accounts and credentials.

```javascript
{
  _id: ObjectId,
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: "" },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatarUrl: { type: String, default: "" },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.2 `properties` Collection
Stores rental properties managed by the user.

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  propertyType: { 
    type: String, 
    enum: ['Apartment', 'Independent House', 'Villa', 'Studio', 'Commercial', 'Other'], 
    default: 'Apartment' 
  },
  address: {
    street: { type: String, default: "" },
    locality: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },
  bhk: { type: Number, required: true, min: 1 },
  areaSqFt: { type: Number, required: true, min: 50 },
  bedrooms: { type: Number, required: true, min: 1 },
  bathrooms: { type: Number, required: true, min: 1 },
  furnishingStatus: { 
    type: String, 
    enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'], 
    default: 'Semi-Furnished' 
  },
  parking: { type: Boolean, default: false },
  amenities: [{ type: String, trim: true }],
  description: { type: String, default: "" },
  listedRent: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['Available', 'Rented', 'Under Maintenance'], 
    default: 'Available',
    index: true
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.3 `leases` Collection
Stores active, upcoming, expired, or terminated lease contracts.

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  propertyId: { type: ObjectId, ref: 'Property', required: true, index: true },
  tenant: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    occupantsCount: { type: Number, default: 1 }
  },
  monthlyRent: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, required: true, min: 0 },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  noticePeriodDays: { type: Number, default: 30 },
  status: { 
    type: String, 
    enum: ['Active', 'Upcoming', 'Expired', 'Terminated'], 
    default: 'Upcoming',
    index: true
  },
  paymentDueDay: { type: Number, default: 1, min: 1, max: 31 },
  importantTerms: [{ type: String }],
  notes: { type: String, default: "" },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.4 `expenses` Collection
Maintains property-specific or general rental operating costs.

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  propertyId: { type: ObjectId, ref: 'Property', index: true, default: null }, // Null = portfolio-wide
  title: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Maintenance', 'Electricity', 'Water', 'Internet', 'Repairs', 'Taxes', 'Other'], 
    required: true,
    index: true
  },
  amount: { type: Number, required: true, min: 0 },
  expenseDate: { type: Date, required: true, index: true },
  isRecurringMonthly: { type: Boolean, default: false },
  notes: { type: String, default: "" },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.5 `predictions` Collection (Audit Log)
Tracks rental price estimation queries requested by users.

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  inputFeatures: {
    city: String,
    locality: String,
    bhk: Number,
    areaSqFt: Number,
    bathrooms: Number,
    furnishingStatus: String,
    parking: Boolean
  },
  predictedRent: { type: Number, required: true },
  modelMetadata: {
    algorithm: String,
    version: String
  },
  createdAt: ISODate
}
```

---

## 4. Indexing Strategy
* **Compound Indexes**:
  * `{ userId: 1, status: 1 }` on `properties` and `leases` for fast filtered dashboard lookups.
  * `{ userId: 1, expenseDate: -1 }` on `expenses` for recent expense feeds and monthly aggregations.
  * `{ propertyId: 1, status: 1 }` on `leases` to verify active lease occupancy prior to updates/deletions.
* **Text Index**:
  * `{ title: 'text', 'address.locality': 'text', 'address.city': 'text' }` on `properties` for fast portfolio searching.
