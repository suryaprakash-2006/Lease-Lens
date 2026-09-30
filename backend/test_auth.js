import http from 'http';
import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import User from './src/models/User.js';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Test suite runner
const runTests = async () => {
  console.log('====================================================');
  console.log('   LEASELENS PHASE 1 — AUTOMATED VERIFICATION SUITE');
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

  // 1. Database Connection
  console.log('1. Testing Database Connection...');
  try {
    await connectDB();
    assert(true, 'MongoDB connected successfully');
  } catch (err) {
    assert(false, 'MongoDB failed to connect', err.message);
    process.exit(1);
  }

  // Start HTTP Server for integration testing
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`  [INFO] Test server listening on ${BASE_URL}\n`);

  const testEmail = `test_landlord_${Date.now()}@leaselens.io`;
  const testPassword = 'Password123!';
  const updatedPassword = 'NewSecretPassword456!';
  let authToken = null;
  let userId = null;

  try {
    // 2. Health Endpoint
    console.log('2. Testing Health Endpoint (/api/health)...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthData.success === true, 'Health payload indicates success = true');
    assert(healthData.data.database.status === 'connected', 'Database reported as connected in health payload');

    // 3. Invalid Registration
    console.log('\n3. Testing Input Validation on Registration...');
    const invalidRegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A', // too short (< 2)
        email: 'invalid-email-format',
        password: '123' // too short (< 6)
      })
    });
    const invalidRegData = await invalidRegRes.json();
    assert(invalidRegRes.status === 400, 'Invalid registration rejected with HTTP 400');
    assert(invalidRegData.error === 'ValidationError', 'Error type is ValidationError');
    assert(Array.isArray(invalidRegData.details) && invalidRegData.details.length >= 3, 'All 3 invalid fields flagged in details');

    // 4. Valid Registration
    console.log('\n4. Testing Valid Registration...');
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arun Kumar',
        email: testEmail,
        password: testPassword,
        phone: '+91 98765 43210'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Valid registration returns HTTP 201 Created');
    assert(regData.success === true, 'Registration reports success = true');
    assert(!!regData.data.token, 'JWT token returned on registration');
    assert(regData.data.user.email === testEmail, 'User email matches registered email');
    assert(regData.data.user.passwordHash === undefined, 'Security: passwordHash is NOT returned in response');
    assert(regData.data.user.password === undefined, 'Security: Plain password is NOT returned in response');
    userId = regData.data.user._id;

    // 5. Duplicate Email Rejection
    console.log('\n5. Testing Duplicate Email Handling...');
    const dupRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: testEmail,
        password: 'SomePassword999'
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 'Duplicate email rejected with HTTP 409 Conflict');
    assert(dupData.error === 'DuplicateResource', 'Error type is DuplicateResource');

    // 6. Invalid Credentials Login
    console.log('\n6. Testing Login with Invalid Password...');
    const badLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!'
      })
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with HTTP 401 Unauthorized');

    // 7. Valid Login
    console.log('\n7. Testing Login with Valid Credentials...');
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login returns HTTP 200 OK');
    assert(!!loginData.data.token, 'JWT token returned on login');
    assert(loginData.data.user.passwordHash === undefined, 'Security: passwordHash is NOT returned in login response');
    authToken = loginData.data.token;

    // 8. Unauthenticated Access to Protected Route
    console.log('\n8. Testing Protected Route Without Token...');
    const unauthRes = await fetch(`${BASE_URL}/api/v1/auth/me`);
    assert(unauthRes.status === 401, 'Unauthenticated /me request rejected with HTTP 401');

    // 9. Authenticated Access to Protected Route
    console.log('\n9. Testing Protected Route With Valid JWT...');
    const authMeRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const authMeData = await authMeRes.json();
    assert(authMeRes.status === 200, 'Authenticated /me returns HTTP 200 OK');
    assert(authMeData.data.user.email === testEmail, 'Authenticated user email matches');
    assert(authMeData.data.user.passwordHash === undefined, 'Security: passwordHash is NOT returned in profile');

    // 10. Update Profile (Name & Phone)
    console.log('\n10. Testing Profile Update (Name & Phone)...');
    const updateRes = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Arun Kumar Sundaram',
        phone: '+91 91234 56789'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Profile update returns HTTP 200 OK');
    assert(updateData.data.user.name === 'Arun Kumar Sundaram', 'User name updated successfully');
    assert(updateData.data.user.phone === '+91 91234 56789', 'User phone updated successfully');

    // 11. Update Password
    console.log('\n11. Testing Password Change via Profile Update...');
    const passChangeRes = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        currentPassword: testPassword,
        newPassword: updatedPassword
      })
    });
    assert(passChangeRes.status === 200, 'Password change returns HTTP 200 OK');

    // 12. Verify New Password Works
    console.log('\n12. Verifying Login with New Password...');
    const newLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword
      })
    });
    assert(newLoginRes.status === 200, 'Login succeeds with new password');

    // 13. Verify Old Password No Longer Works
    console.log('\n13. Verifying Old Password is Invalidated...');
    const oldLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    assert(oldLoginRes.status === 401, 'Login correctly rejected with old password');

    // Clean up test document
    if (userId) {
      await User.findByIdAndDelete(userId);
      console.log('\n  [CLEANUP] Deleted test user record from MongoDB');
    }

  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
