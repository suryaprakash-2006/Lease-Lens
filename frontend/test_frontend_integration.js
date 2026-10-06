import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded
process.env.JWT_SECRET = process.env.JWT_SECRET || 'leaselens_dev_secret_jwt_key_2026_academic_demo';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaselens';
process.env.NODE_ENV = 'test';

import app from '../backend/src/app.js';
import { connectDB, disconnectDB } from '../backend/src/config/db.js';
import User from '../backend/src/models/User.js';
import Property from '../backend/src/models/Property.js';

const BACKEND_PORT = 5096;
const BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1`;

const runFrontendIntegrationTest = async () => {
  console.log('====================================================');
  console.log('   LEASELENS PHASE 3 — FRONTEND API INTEGRATION TEST');
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
  console.log(`  [INFO] Real Backend Test Server listening on http://localhost:${BACKEND_PORT}\n`);

  const testEmail = `frontend_test_${Date.now()}@leaselens.io`;
  const testPassword = 'SecurePassword123!';
  let token = null;
  let testUserId = null;
  let testPropertyId = null;

  try {
    // 1. Test Registration Flow
    console.log('1. Testing Frontend Registration API Flow...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Frontend Test Landlord',
        email: testEmail,
        password: testPassword,
        phone: '+91 9988776655'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Frontend registration succeeds with HTTP 201');
    assert(regData.success === true, 'Response payload success is true');
    assert(!!regData.data.token, 'JWT token returned on registration');
    token = regData.data.token;
    testUserId = regData.data.user._id;

    // 2. Test Login Flow
    console.log('\n2. Testing Frontend Login API Flow...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Frontend login succeeds with HTTP 200');
    assert(loginData.data.user.email === testEmail, 'User email matches profile in state');

    // 3. Test Session Re-hydration (/auth/me)
    console.log('\n3. Testing AuthContext Session Initialization (/auth/me)...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'Session re-hydration via /auth/me returns HTTP 200');
    assert(meData.data.user.name === 'Frontend Test Landlord', 'Authenticated user state restored correctly');

    // 4. Test Route Protection
    console.log('\n4. Testing Unauthenticated Route Protection...');
    const unauthRes = await fetch(`${BASE_URL}/dashboard/metrics`);
    assert(unauthRes.status === 401, 'Unauthenticated access rejected with HTTP 401');

    // 5. Test Dashboard Metrics Flow
    console.log('\n5. Testing Dashboard Metrics API Flow...');
    const dashRes = await fetch(`${BASE_URL}/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'Dashboard metrics returned with HTTP 200');
    assert(dashData.data.properties.total === 0, 'Initial state returns 0 properties cleanly');
    assert(dashData.data.leases.active === 0, 'Initial state returns 0 active leases cleanly');

    // 6. Test Property Creation & List Flow
    console.log('\n6. Testing Property API Flow...');
    const propRes = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Palm Grove 2BHK',
        propertyType: 'Apartment',
        address: {
          locality: 'Koramangala',
          city: 'Bengaluru'
        },
        bhk: 2,
        areaSqFt: 1100,
        bedrooms: 2,
        bathrooms: 2,
        furnishingStatus: 'Semi-Furnished',
        listedRent: 32000
      })
    });
    const propData = await propRes.json();
    assert(propRes.status === 201, 'Property created via frontend API flow');
    testPropertyId = propData.data._id;

    const listPropRes = await fetch(`${BASE_URL}/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listPropData = await listPropRes.json();
    assert(listPropData.data.properties.length === 1, 'Properties list returns 1 listing');

    // 7. Test Profile Update Flow
    console.log('\n7. Testing Profile Update Flow...');
    const updateProfRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Updated Landlord Name',
        phone: '+91 9112233445'
      })
    });
    const updateProfData = await updateProfRes.json();
    assert(updateProfRes.status === 200, 'Profile updated successfully');
    assert(updateProfData.data.user.name === 'Updated Landlord Name', 'Updated name persisted in database');

    // Clean up
    console.log('\n8. Cleaning Up Integration Test Records...');
    await Property.deleteMany({ userId: testUserId });
    await User.deleteMany({ _id: testUserId });
    console.log('  [CLEANUP] Removed test user and property records from MongoDB.');

  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  }

  console.log('\n====================================================');
  console.log(`FRONTEND INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runFrontendIntegrationTest();
