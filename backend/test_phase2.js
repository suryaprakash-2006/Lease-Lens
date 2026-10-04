import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import User from './src/models/User.js';
import Property from './src/models/Property.js';
import Lease from './src/models/Lease.js';
import Expense from './src/models/Expense.js';

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}`;

const runTests = async () => {
  console.log('====================================================');
  console.log('   LEASELENS PHASE 2 — DOMAIN & BUSINESS LOGIC SUITE');
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

  // Connect to DB
  try {
    await connectDB();
    assert(true, 'Database connected successfully for Phase 2 tests');
  } catch (err) {
    assert(false, 'Database connection failed', err.message);
    process.exit(1);
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`  [INFO] Test server listening on ${BASE_URL}\n`);

  // Identifiers for tracking and cleanup
  const userAEmail = `landlord_a_${Date.now()}@leaselens.io`;
  const userBEmail = `landlord_b_${Date.now()}@leaselens.io`;
  const testPassword = 'SecurePassword123!';

  let tokenA = null;
  let tokenB = null;
  let userAId = null;
  let userBId = null;

  let propertyAId = null;
  let propertyBId = null;
  let leaseAId = null;
  let expenseAId = null;

  try {
    // ----------------------------------------------------
    // 1. SETUP: REGISTER 2 SEPARATE USERS
    // ----------------------------------------------------
    console.log('1. Setting Up Test Users (User A & User B)...');

    const regARes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Landlord Alice', email: userAEmail, password: testPassword })
    });
    const regAData = await regARes.json();
    tokenA = regAData.data.token;
    userAId = regAData.data.user._id;

    const regBRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Landlord Bob', email: userBEmail, password: testPassword })
    });
    const regBData = await regBRes.json();
    tokenB = regBData.data.token;
    userBId = regBData.data.user._id;

    assert(!!tokenA && !!tokenB, 'Both User A and User B registered with valid tokens');

    // ----------------------------------------------------
    // 2. PROPERTY MODULE TESTS
    // ----------------------------------------------------
    console.log('\n2. Testing Property Module...');

    // 2.1 Unauthenticated request rejected
    const unauthPropRes = await fetch(`${BASE_URL}/api/v1/properties`);
    assert(unauthPropRes.status === 401, 'Unauthenticated GET /properties rejected with HTTP 401');

    // 2.2 Invalid property creation validation
    const invalidPropRes = await fetch(`${BASE_URL}/api/v1/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'X', // too short (< 2)
        bhk: 0,     // invalid min (< 1)
        areaSqFt: 20 // invalid min (< 50)
      })
    });
    const invalidPropData = await invalidPropRes.json();
    assert(invalidPropRes.status === 400, 'Invalid property creation rejected with HTTP 400');
    assert(invalidPropData.error === 'ValidationError', 'Validation error returned for invalid property fields');

    // 2.3 Valid property creation for User A
    const validPropARes = await fetch(`${BASE_URL}/api/v1/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Sunset Heights 3BHK',
        propertyType: 'Apartment',
        address: {
          locality: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038'
        },
        bhk: 3,
        areaSqFt: 1650,
        bedrooms: 3,
        bathrooms: 3,
        furnishingStatus: 'Semi-Furnished',
        parking: true,
        amenities: ['Gym', 'Swimming Pool', 'Power Backup'],
        listedRent: 45000,
        status: 'Available'
      })
    });
    const validPropAData = await validPropARes.json();
    assert(validPropARes.status === 201, 'User A property created successfully with HTTP 201');
    assert(validPropAData.data.title === 'Sunset Heights 3BHK', 'Created property has correct title');
    assert(validPropAData.data.userId === userAId, 'Security: Property explicitly assigned to User A');
    propertyAId = validPropAData.data._id;

    // 2.4 Valid property creation for User B
    const validPropBRes = await fetch(`${BASE_URL}/api/v1/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        title: 'Bob Marina Bay Villa',
        propertyType: 'Villa',
        address: {
          locality: 'ECR',
          city: 'Chennai',
          state: 'Tamil Nadu'
        },
        bhk: 4,
        areaSqFt: 3200,
        bedrooms: 4,
        bathrooms: 4,
        furnishingStatus: 'Furnished',
        listedRent: 80000,
        status: 'Available'
      })
    });
    const validPropBData = await validPropBRes.json();
    propertyBId = validPropBData.data._id;
    assert(validPropBRes.status === 201, 'User B property created successfully');

    // 2.5 Multi-tenant isolation: User A listing only returns User A's property
    const listPropARes = await fetch(`${BASE_URL}/api/v1/properties`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const listPropAData = await listPropARes.json();
    assert(listPropARes.status === 200, 'User A gets properties list');
    assert(listPropAData.data.properties.length === 1, 'User A sees exactly 1 property');
    assert(listPropAData.data.properties[0]._id === propertyAId, 'User A only sees their own property');

    // 2.6 Filtering properties by city & BHK
    const filterCityRes = await fetch(`${BASE_URL}/api/v1/properties?city=Bengaluru&bhk=3`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const filterCityData = await filterCityRes.json();
    assert(filterCityData.data.properties.length === 1, 'City and BHK filters correctly match User A property');

    const filterMismatchRes = await fetch(`${BASE_URL}/api/v1/properties?city=Chennai`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const filterMismatchData = await filterMismatchRes.json();
    assert(filterMismatchData.data.properties.length === 0, 'City filter correctly excludes mismatched properties');

    // 2.7 Get property by ID
    const getPropARes = await fetch(`${BASE_URL}/api/v1/properties/${propertyAId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const getPropAData = await getPropARes.json();
    assert(getPropARes.status === 200, 'User A can fetch their property by ID');
    assert(getPropAData.data.property.title === 'Sunset Heights 3BHK', 'Property title matches');
    assert(getPropAData.data.activeLease === null, 'Active lease is initially null');
    assert(getPropAData.data.expenseSummary.totalExpenses === 0, 'Initial expense total is 0');

    // 2.8 Security Check: User B CANNOT access User A's property
    const crossGetPropRes = await fetch(`${BASE_URL}/api/v1/properties/${propertyAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossGetPropRes.status === 404, 'Cross-user property GET rejected with HTTP 404');

    // 2.9 Update property
    const updatePropRes = await fetch(`${BASE_URL}/api/v1/properties/${propertyAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Sunset Heights Luxury 3BHK',
        listedRent: 48000
      })
    });
    const updatePropData = await updatePropRes.json();
    assert(updatePropRes.status === 200, 'Property updated successfully');
    assert(updatePropData.data.title === 'Sunset Heights Luxury 3BHK', 'Updated title persisted');
    assert(updatePropData.data.listedRent === 48000, 'Updated rent persisted');

    // 2.10 Security Check: User B CANNOT update User A's property
    const crossUpdatePropRes = await fetch(`${BASE_URL}/api/v1/properties/${propertyAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    assert(crossUpdatePropRes.status === 404, 'Cross-user property PUT rejected with HTTP 404');

    // ----------------------------------------------------
    // 3. LEASE MODULE TESTS
    // ----------------------------------------------------
    console.log('\n3. Testing Lease Module...');

    // 3.1 Security Check: User B CANNOT create lease on User A's property
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 10); // Active lease started 10 days ago
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 20);   // Expires in 20 days (approaching expiration)

    const crossLeaseCreateRes = await fetch(`${BASE_URL}/api/v1/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        propertyId: propertyAId, // User A's property!
        tenant: {
          name: 'Intruder Tenant',
          email: 'intruder@test.com',
          phone: '9999999999'
        },
        monthlyRent: 48000,
        securityDeposit: 100000,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    });
    assert(crossLeaseCreateRes.status === 404, 'Cross-user lease creation rejected with HTTP 404');

    // 3.2 Date Validation: Start date >= End date rejected
    const badDatesLeaseRes = await fetch(`${BASE_URL}/api/v1/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        propertyId: propertyAId,
        tenant: {
          name: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          phone: '+91 9876543210'
        },
        monthlyRent: 48000,
        securityDeposit: 100000,
        startDate: endDate.toISOString(),
        endDate: startDate.toISOString() // Invalid: start >= end
      })
    });
    assert(badDatesLeaseRes.status === 400, 'Invalid lease date order rejected with HTTP 400');

    // 3.3 Valid Lease Creation for User A
    const validLeaseRes = await fetch(`${BASE_URL}/api/v1/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        propertyId: propertyAId,
        tenant: {
          name: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          phone: '+91 9876543210',
          occupantsCount: 2
        },
        monthlyRent: 48000,
        securityDeposit: 100000,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        noticePeriodDays: 30,
        paymentDueDay: 5,
        importantTerms: ['No subletting', 'Maintenance by 5th of each month']
      })
    });
    const validLeaseData = await validLeaseRes.json();
    assert(validLeaseRes.status === 201, 'Lease created successfully with HTTP 201');
    assert(validLeaseData.data.status === 'Active', 'Lease status automatically computed as Active');
    assert(validLeaseData.data.userId === userAId, 'Lease explicitly owned by User A');
    leaseAId = validLeaseData.data._id;

    // 3.4 Verify Property status auto-transitioned to 'Rented'
    const updatedPropCheck = await Property.findById(propertyAId);
    assert(updatedPropCheck.status === 'Rented', 'Property status automatically synced to Rented');

    // 3.5 List Leases for User A
    const listLeaseRes = await fetch(`${BASE_URL}/api/v1/leases`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const listLeaseData = await listLeaseRes.json();
    assert(listLeaseRes.status === 200, 'User A can list their leases');
    assert(listLeaseData.data.leases.length === 1, 'User A sees 1 lease');
    assert(listLeaseData.data.leases[0]._id === leaseAId, 'Lease ID matches');

    // 3.6 Security Check: User B CANNOT list or view User A's lease
    const listLeaseBRes = await fetch(`${BASE_URL}/api/v1/leases`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const listLeaseBData = await listLeaseBRes.json();
    assert(listLeaseBData.data.leases.length === 0, 'User B sees 0 leases');

    const crossGetLeaseRes = await fetch(`${BASE_URL}/api/v1/leases/${leaseAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossGetLeaseRes.status === 404, 'Cross-user lease GET rejected with HTTP 404');

    // 3.7 Upcoming Lease Event Detection (<= 30 days)
    const upcomingEventsRes = await fetch(`${BASE_URL}/api/v1/leases/upcoming`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const upcomingEventsData = await upcomingEventsRes.json();
    assert(upcomingEventsRes.status === 200, 'Upcoming lease events endpoint returns HTTP 200');
    assert(upcomingEventsData.data.events.length === 1, 'Approaching lease expiration correctly identified');
    assert(upcomingEventsData.data.events[0].eventType === 'EXPIRATION', 'Event type marked as EXPIRATION');
    assert(upcomingEventsData.data.events[0].daysRemaining <= 21, 'Days remaining accurately calculated (~20 days)');

    // 3.8 Safeguard: Cannot delete property while Active lease is attached
    const deletePropFailRes = await fetch(`${BASE_URL}/api/v1/properties/${propertyAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(deletePropFailRes.status === 409, 'Safeguard: Deleting property with active lease rejected with HTTP 409');

    // 3.9 Transition Lease status to 'Terminated' via PATCH
    const patchStatusRes = await fetch(`${BASE_URL}/api/v1/leases/${leaseAId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'Terminated' })
    });
    const patchStatusData = await patchStatusRes.json();
    assert(patchStatusRes.status === 200, 'Lease status transitioned to Terminated');
    assert(patchStatusData.data.status === 'Terminated', 'Terminated status persisted');

    // Verify Property status reset to 'Available'
    const propRestoredCheck = await Property.findById(propertyAId);
    assert(propRestoredCheck.status === 'Available', 'Property status restored to Available on lease termination');

    // ----------------------------------------------------
    // 4. EXPENSE MODULE TESTS
    // ----------------------------------------------------
    console.log('\n4. Testing Expense Module...');

    // 4.1 Security Check: User B CANNOT log expense against User A's property
    const crossExpenseRes = await fetch(`${BASE_URL}/api/v1/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        propertyId: propertyAId,
        title: 'Unauthorized Repair',
        category: 'Repairs',
        amount: 5000,
        expenseDate: new Date().toISOString()
      })
    });
    assert(crossExpenseRes.status === 404, 'Cross-user expense logging rejected with HTTP 404');

    // 4.2 Valid Expense Logging for User A (Property Linked)
    const validExpense1Res = await fetch(`${BASE_URL}/api/v1/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        propertyId: propertyAId,
        title: 'AC Servicing & Filter Replacement',
        category: 'Maintenance',
        amount: 3500,
        expenseDate: new Date().toISOString(),
        isRecurringMonthly: false,
        notes: 'Annual servicing for master bedroom AC'
      })
    });
    const validExpense1Data = await validExpense1Res.json();
    assert(validExpense1Res.status === 201, 'Expense 1 logged successfully with HTTP 201');
    assert(validExpense1Data.data.amount === 3500, 'Expense amount is 3500');
    expenseAId = validExpense1Data.data._id;

    // 4.3 Second Expense for User A (Portfolio-wide, no propertyId)
    const validExpense2Res = await fetch(`${BASE_URL}/api/v1/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Property Tax Legal Advisory',
        category: 'Taxes',
        amount: 6500,
        expenseDate: new Date().toISOString(),
        notes: 'Annual audit fee'
      })
    });
    assert(validExpense2Res.status === 201, 'Portfolio-wide expense 2 logged successfully');

    // 4.4 List Expenses for User A & Filtering by Category
    const listExpMaintRes = await fetch(`${BASE_URL}/api/v1/expenses?category=Maintenance`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const listExpMaintData = await listExpMaintRes.json();
    assert(listExpMaintData.data.expenses.length === 1, 'Category filter returns 1 maintenance expense');
    assert(listExpMaintData.data.expenses[0].category === 'Maintenance', 'Category matches Maintenance');

    // 4.5 Security Check: User B CANNOT view or update User A's expense
    const crossGetExpRes = await fetch(`${BASE_URL}/api/v1/expenses/${expenseAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossGetExpRes.status === 404, 'Cross-user expense GET rejected with HTTP 404');

    const crossPutExpRes = await fetch(`${BASE_URL}/api/v1/expenses/${expenseAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ amount: 99999 })
    });
    assert(crossPutExpRes.status === 404, 'Cross-user expense PUT rejected with HTTP 404');

    // 4.6 Aggregated Expense Summary Pipeline
    const summaryRes = await fetch(`${BASE_URL}/api/v1/expenses/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200, 'Expense summary aggregation returns HTTP 200');
    assert(summaryData.data.totalExpenses === 10000, 'Total aggregated expenses equals 10,000 (3500 + 6500)');
    assert(summaryData.data.expenseCount === 2, 'Expense count equals 2');
    assert(summaryData.data.byCategory.length === 2, 'Two category breakdown entries present');

    // User B summary must be empty / 0
    const summaryBRes = await fetch(`${BASE_URL}/api/v1/expenses/summary`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const summaryBData = await summaryBRes.json();
    assert(summaryBData.data.totalExpenses === 0, 'User B aggregated expenses is 0 (data isolation confirmed)');

    // ----------------------------------------------------
    // 5. DASHBOARD MODULE TESTS
    // ----------------------------------------------------
    console.log('\n5. Testing Dashboard Aggregations...');

    // 5.1 Dashboard Metrics for User A
    const dashMetricsRes = await fetch(`${BASE_URL}/api/v1/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dashMetricsData = await dashMetricsRes.json();
    assert(dashMetricsRes.status === 200, 'Dashboard metrics returned with HTTP 200');
    assert(dashMetricsData.data.properties.total === 1, 'Total properties metric is 1');
    assert(dashMetricsData.data.properties.available === 1, 'Available properties metric is 1');
    assert(dashMetricsData.data.leases.terminated === 1, 'Terminated lease count is 1');
    assert(dashMetricsData.data.expenses.totalAllTime === 10000, 'Total expenses metric is 10,000');

    // 5.2 Empty State Dashboard Metrics for User B (with 1 property, 0 leases, 0 expenses)
    const dashMetricsBRes = await fetch(`${BASE_URL}/api/v1/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dashMetricsBData = await dashMetricsBRes.json();
    assert(dashMetricsBData.data.properties.total === 1, 'User B has 1 property');
    assert(dashMetricsBData.data.leases.active === 0, 'User B active leases is 0');
    assert(dashMetricsBData.data.expenses.totalAllTime === 0, 'User B expenses is 0');
    assert(dashMetricsBData.data.financials.monthlyRentalIncome === 0, 'User B monthly rental income is 0');

    // 5.3 Expense Chart Data
    const expenseChartRes = await fetch(`${BASE_URL}/api/v1/dashboard/expense-chart?months=6`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const expenseChartData = await expenseChartRes.json();
    assert(expenseChartRes.status === 200, 'Expense chart data returned with HTTP 200');
    assert(expenseChartData.data.monthlyTimeline.length === 6, 'Monthly timeline contains 6 months');
    assert(expenseChartData.data.totalPeriodExpenses === 10000, 'Total period expenses in chart is 10,000');

    // 5.4 Recent Activity Feed
    const recentActRes = await fetch(`${BASE_URL}/api/v1/dashboard/recent-activity?limit=5`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const recentActData = await recentActRes.json();
    assert(recentActRes.status === 200, 'Recent activity returned with HTTP 200');
    assert(recentActData.data.activity.length >= 3, 'Recent activity feed contains property, lease, and expense actions');
    assert(recentActData.data.activity[0].timestamp !== undefined, 'Activity items have timestamp metadata');

    // ----------------------------------------------------
    // 6. CLEANUP & TEARDOWN
    // ----------------------------------------------------
    console.log('\n6. Cleaning Up Test Data...');
    await Property.deleteMany({ userId: { $in: [userAId, userBId] } });
    await Lease.deleteMany({ userId: { $in: [userAId, userBId] } });
    await Expense.deleteMany({ userId: { $in: [userAId, userBId] } });
    await User.deleteMany({ _id: { $in: [userAId, userBId] } });
    console.log('  [CLEANUP] Successfully removed test properties, leases, expenses, and users.');

  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  }

  console.log('\n====================================================');
  console.log(`PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
