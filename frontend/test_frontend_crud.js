import http from 'http';

// Ensure environment variables are loaded
process.env.JWT_SECRET = process.env.JWT_SECRET || 'leaselens_dev_secret_jwt_key_2026_academic_demo';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaselens';
process.env.NODE_ENV = 'test';

import app from '../backend/src/app.js';
import { connectDB, disconnectDB } from '../backend/src/config/db.js';
import User from '../backend/src/models/User.js';
import Property from '../backend/src/models/Property.js';
import Lease from '../backend/src/models/Lease.js';
import Expense from '../backend/src/models/Expense.js';

const BACKEND_PORT = 5095;
const BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1`;

const runFullCrudFlowTest = async () => {
  console.log('====================================================');
  console.log('   LEASELENS PHASE 4 — FULL FRONTEND CRUD FLOW TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title} ${details ? `-> ${details}` : ''}`);
      failed++;
    }
  };

  await connectDB();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(BACKEND_PORT, resolve));
  console.log(`  [INFO] Backend Test Server listening on http://localhost:${BACKEND_PORT}\n`);

  const testEmail = `phase4_landlord_${Date.now()}@leaselens.io`;
  const originalPassword = 'InitialPassword123!';
  const updatedPassword = 'NewSecretPassword456!';
  let token = null;
  let userId = null;

  let prop1Id = null;
  let prop2Id = null;
  let leaseId = null;
  let exp1Id = null;
  let exp2Id = null;

  try {
    // ----------------------------------------------------
    // 1. AUTHENTICATION FLOW
    // ----------------------------------------------------
    console.log('1. Testing Full Authentication Flow...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Karthik Raja',
        email: testEmail,
        password: originalPassword,
        phone: '+91 9887766554'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'User registration returns HTTP 201');
    token = regData.data.token;
    userId = regData.data.user._id;

    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'Session re-hydration via /auth/me returns HTTP 200');
    assert(meData.data.user.email === testEmail, 'Authenticated user email matches');

    // ----------------------------------------------------
    // 2. DASHBOARD ZERO-STATE FLOW
    // ----------------------------------------------------
    console.log('\n2. Testing Initial Dashboard Zero-State...');
    const zeroMetricsRes = await fetch(`${BASE_URL}/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const zeroMetrics = await zeroMetricsRes.json();
    assert(zeroMetrics.status === 200 || zeroMetricsRes.status === 200, 'Dashboard metrics returned for empty portfolio');
    assert(zeroMetrics.data.properties.total === 0, 'Zero-state total properties equals 0');
    assert(zeroMetrics.data.financials.monthlyRentalIncome === 0, 'Zero-state monthly rental income equals 0');

    // ----------------------------------------------------
    // 3. PROPERTIES CRUD & FILTERING FLOW
    // ----------------------------------------------------
    console.log('\n3. Testing Properties CRUD & Filter Flows...');

    // 3.1 Create Property 1
    const createProp1Res = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Green Meadows Luxury Villa',
        propertyType: 'Villa',
        address: {
          locality: 'Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066'
        },
        bhk: 4,
        areaSqFt: 3200,
        bedrooms: 4,
        bathrooms: 4,
        furnishingStatus: 'Furnished',
        parking: true,
        amenities: ['Gym', 'Swimming Pool', '24x7 Security & CCTV', 'Covered Car Parking'],
        listedRent: 65000,
        status: 'Available'
      })
    });
    const prop1Data = await createProp1Res.json();
    assert(createProp1Res.status === 201, 'Property 1 created successfully with HTTP 201');
    prop1Id = prop1Data.data._id;

    // 3.2 Create Property 2
    const createProp2Res = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Sunrise Heights 2BHK',
        propertyType: 'Apartment',
        address: {
          locality: 'Velachery',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600042'
        },
        bhk: 2,
        areaSqFt: 1150,
        bedrooms: 2,
        bathrooms: 2,
        furnishingStatus: 'Semi-Furnished',
        parking: true,
        amenities: ['Elevator / Lift', '24x7 Power Backup'],
        listedRent: 28000,
        status: 'Available'
      })
    });
    const prop2Data = await createProp2Res.json();
    assert(createProp2Res.status === 201, 'Property 2 created successfully with HTTP 201');
    prop2Id = prop2Data.data._id;

    // 3.3 List & Filter Properties
    const listAllPropsRes = await fetch(`${BASE_URL}/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listAllProps = await listAllPropsRes.json();
    assert(listAllProps.data.properties.length === 2, 'List properties returns both created units');

    const filterCityRes = await fetch(`${BASE_URL}/properties?city=Bengaluru`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const filterCity = await filterCityRes.json();
    assert(filterCity.data.properties.length === 1, 'City filter correctly isolates Bengaluru property');
    assert(filterCity.data.properties[0]._id === prop1Id, 'Matched property ID is Property 1');

    // 3.4 Read Single Property by ID
    const getProp1Res = await fetch(`${BASE_URL}/properties/${prop1Id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getProp1 = await getProp1Res.json();
    assert(getProp1Res.status === 200, 'Get single property by ID returns HTTP 200');
    assert(getProp1.data.property.title === 'Green Meadows Luxury Villa', 'Property title matches specifications');
    assert(getProp1.data.activeLease === null, 'Active lease is initially null');

    // 3.5 Update Property
    const updateProp1Res = await fetch(`${BASE_URL}/properties/${prop1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Green Meadows Luxury Villa (Renovated)',
        listedRent: 70000
      })
    });
    const updateProp1 = await updateProp1Res.json();
    assert(updateProp1Res.status === 200, 'Property updated successfully with HTTP 200');
    assert(updateProp1.data.listedRent === 70000, 'Updated rent of 70,000 persisted');

    // ----------------------------------------------------
    // 4. LEASES CRUD & LIFECYCLE FLOW
    // ----------------------------------------------------
    console.log('\n4. Testing Leases CRUD & Lifecycle Flow...');

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 5); // Active lease started 5 days ago
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 20);  // Expires in 20 days (approaching expiration)

    // 4.1 Create Lease for Property 1
    const createLeaseRes = await fetch(`${BASE_URL}/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        propertyId: prop1Id,
        tenant: {
          name: 'Ananya Deshmukh',
          email: 'ananya.deshmukh@example.com',
          phone: '+91 91234 56789',
          occupantsCount: 3
        },
        monthlyRent: 70000,
        securityDeposit: 200000,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        noticePeriodDays: 30,
        paymentDueDay: 1,
        importantTerms: ['No commercial subletting', 'Maintenance by 1st of month']
      })
    });
    const leaseData = await createLeaseRes.json();
    assert(createLeaseRes.status === 201, 'Lease created successfully with HTTP 201');
    assert(leaseData.data.status === 'Active', 'Lease status automatically computed as Active');
    leaseId = leaseData.data._id;

    // 4.2 Verify Property Status auto-synced to 'Rented'
    const checkPropRented = await Property.findById(prop1Id);
    assert(checkPropRented.status === 'Rented', 'Property 1 status automatically synced to Rented');

    // 4.3 Verify Upcoming Expiration Event
    const upcomingRes = await fetch(`${BASE_URL}/leases/upcoming`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const upcomingData = await upcomingRes.json();
    assert(upcomingData.data.events.length === 1, 'Upcoming lease expiration event accurately identified');
    assert(upcomingData.data.events[0].eventType === 'EXPIRATION', 'Event type is EXPIRATION');

    // 4.4 Verify Active Lease Deletion Safeguard on Property
    const conflictDeletePropRes = await fetch(`${BASE_URL}/properties/${prop1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(conflictDeletePropRes.status === 409, 'Deleting property with active lease safely rejected with HTTP 409 Conflict');

    // 4.5 Terminate Lease Early via Status Patch
    const terminateLeaseRes = await fetch(`${BASE_URL}/leases/${leaseId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Terminated' })
    });
    const terminatedData = await terminateLeaseRes.json();
    assert(terminateLeaseRes.status === 200, 'Lease status updated to Terminated via PATCH');
    assert(terminatedData.data.status === 'Terminated', 'Terminated status persisted');

    // 4.6 Verify Property Status restored to 'Available'
    const checkPropAvailable = await Property.findById(prop1Id);
    assert(checkPropAvailable.status === 'Available', 'Property 1 status restored to Available upon lease termination');

    // 4.7 Delete Lease
    const deleteLeaseRes = await fetch(`${BASE_URL}/leases/${leaseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(deleteLeaseRes.status === 200, 'Lease deleted successfully');

    // ----------------------------------------------------
    // 5. EXPENSES CRUD & SUMMARY AGGREGATION FLOW
    // ----------------------------------------------------
    console.log('\n5. Testing Expenses CRUD & Aggregation Flow...');

    // 5.1 Create Property-Linked Expense
    const createExp1Res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Elevator Annual Maintenance Contract',
        category: 'Maintenance',
        amount: 8500,
        propertyId: prop1Id,
        expenseDate: new Date().toISOString(),
        isRecurringMonthly: false,
        notes: 'Annual AMC servicing'
      })
    });
    const exp1Data = await createExp1Res.json();
    assert(createExp1Res.status === 201, 'Property-linked expense logged successfully');
    exp1Id = exp1Data.data._id;

    // 5.2 Create Portfolio-Wide Expense
    const createExp2Res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Portfolio Legal & Accounting Advisory',
        category: 'Taxes',
        amount: 12000,
        expenseDate: new Date().toISOString(),
        notes: 'FY 2026 tax filing retainer'
      })
    });
    const exp2Data = await createExp2Res.json();
    assert(createExp2Res.status === 201, 'Portfolio-wide expense logged successfully');
    exp2Id = exp2Data.data._id;

    // 5.3 Filter Expenses by Category
    const filterCatRes = await fetch(`${BASE_URL}/expenses?category=Maintenance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const filterCat = await filterCatRes.json();
    assert(filterCat.data.expenses.length === 1, 'Category filter returns 1 maintenance expense');
    assert(filterCat.data.expenses[0]._id === exp1Id, 'Matched expense is Expense 1');

    // 5.4 Update Expense
    const updateExp1Res = await fetch(`${BASE_URL}/expenses/${exp1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 9000 })
    });
    const updateExp1 = await updateExp1Res.json();
    assert(updateExp1Res.status === 200, 'Expense updated successfully');
    assert(updateExp1.data.amount === 9000, 'Updated amount of 9,000 persisted');

    // 5.5 Aggregated Expense Summary
    const expSummaryRes = await fetch(`${BASE_URL}/expenses/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const expSummary = await expSummaryRes.json();
    assert(expSummaryRes.status === 200, 'Expense summary aggregation returns HTTP 200');
    assert(expSummary.data.totalExpenses === 21000, 'Total aggregated expenses equals 21,000 (9,000 + 12,000)');
    assert(expSummary.data.expenseCount === 2, 'Expense count equals 2');
    assert(expSummary.data.byCategory.length === 2, 'Two category breakdowns present');

    // 5.6 Delete Expense
    const deleteExp1Res = await fetch(`${BASE_URL}/expenses/${exp1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(deleteExp1Res.status === 200, 'Expense 1 deleted successfully');

    // ----------------------------------------------------
    // 6. DASHBOARD POPULATED STATE FLOW
    // ----------------------------------------------------
    console.log('\n6. Testing Populated Dashboard Analytics...');
    const popDashboardRes = await fetch(`${BASE_URL}/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const popMetrics = await popDashboardRes.json();
    assert(popMetrics.data.properties.total === 2, 'Dashboard reflects 2 total properties');
    assert(popMetrics.data.properties.available === 2, 'Dashboard reflects 2 available properties');
    assert(popMetrics.data.expenses.totalAllTime === 12000, 'Dashboard reflects remaining expense total of 12,000');

    const activityRes = await fetch(`${BASE_URL}/dashboard/recent-activity?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const activityData = await activityRes.json();
    assert(activityData.data.activity.length >= 3, 'Recent activity feed captures recent actions');

    // ----------------------------------------------------
    // 7. PROFILE UPDATE & PASSWORD CHANGE FLOW
    // ----------------------------------------------------
    console.log('\n7. Testing Profile Update & Password Change...');
    const updateProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Karthik Raja Sundaram',
        phone: '+91 91234 56789',
        currentPassword: originalPassword,
        newPassword: updatedPassword
      })
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, 'Profile & password update returns HTTP 200');
    assert(updateProfileData.data.user.name === 'Karthik Raja Sundaram', 'Updated name persisted in database');

    // Verify Login with New Password
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword
      })
    });
    assert(newLoginRes.status === 200, 'Login succeeds with new password');

    // ----------------------------------------------------
    // 8. TEARDOWN & CLEANUP
    // ----------------------------------------------------
    console.log('\n8. Cleaning Up Full Test Records...');
    await Expense.deleteMany({ userId });
    await Lease.deleteMany({ userId });
    await Property.deleteMany({ userId });
    await User.deleteMany({ _id: userId });
    console.log('  [CLEANUP] Successfully removed test user, properties, and expenses.');

  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  }

  console.log('\n====================================================');
  console.log(`FULL CRUD FLOW TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runFullCrudFlowTest();
