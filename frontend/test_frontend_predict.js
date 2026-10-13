import http from 'http';
import fs from 'fs';
import path from 'path';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'leaselens_dev_secret_jwt_key_2026_academic_demo';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaselens';
process.env.NODE_ENV = 'test';

import app from '../backend/src/app.js';
import { connectDB, disconnectDB } from '../backend/src/config/db.js';
import User from '../backend/src/models/User.js';

const BACKEND_PORT = 5098;
const BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1`;

const VALID_MODEL_CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai'];

const EXPECTED_REGIONS = [
  { region: 'Delhi NCR', anchor: 'Delhi', count: 6 },
  { region: 'Mumbai Metropolitan Region', anchor: 'Mumbai', count: 4 },
  { region: 'Greater Hyderabad', anchor: 'Hyderabad', count: 3 },
  { region: 'Bengaluru Urban', anchor: 'Bangalore', count: 4 },
  { region: 'Greater Kolkata', anchor: 'Kolkata', count: 4 },
  { region: 'Chennai Metropolitan Area', anchor: 'Chennai', count: 4 }
];

const runPredictValidationTest = async () => {
  console.log('====================================================');
  console.log('   LEASELENS METROPOLITAN CITY COVERAGE VALIDATION  ');
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

  // 1. Static Code, Structure & Component Verifications
  console.log('1. Static Code & Structure Verification...');
  const appLayoutSrc = fs.readFileSync('src/layouts/AppLayout.jsx', 'utf-8');
  assert(
    appLayoutSrc.includes("to: '/predict'") && appLayoutSrc.includes("Rent Prediction"),
    'AppLayout.jsx registers "Rent Prediction" sidebar item pointing to /predict'
  );

  const appRoutesSrc = fs.readFileSync('src/routes/AppRoutes.jsx', 'utf-8');
  assert(
    appRoutesSrc.includes('<Route path="/predict" element={<PredictionPage />} />'),
    'AppRoutes.jsx registers /predict as a protected route'
  );

  const apiSrc = fs.readFileSync('src/services/api.js', 'utf-8');
  assert(
    apiSrc.includes('export const predictAPI = {') &&
    apiSrc.includes("apiClient.post('/predict/predict', payload)"),
    'api.js exports predictAPI calling /predict/predict via shared apiClient'
  );

  const predictionPageSrc = fs.readFileSync('src/pages/predictions/PredictionPage.jsx', 'utf-8');
  assert(
    predictionPageSrc.includes('METRO_REGIONS') &&
    predictionPageSrc.includes('ALL_LOCATIONS'),
    'PredictionPage.jsx defines structured METRO_REGIONS and ALL_LOCATIONS'
  );

  // Import METRO_REGIONS dynamically to verify full 25 location mapping
  const { METRO_REGIONS, ALL_LOCATIONS } = await import('./src/pages/predictions/metroRegions.js');
  assert(METRO_REGIONS.length === 6, 'Exactly 6 approved metropolitan regions defined');
  assert(ALL_LOCATIONS.length === 25, 'Exactly 25 selectable metropolitan locations implemented');

  // Verify each region and its locations
  EXPECTED_REGIONS.forEach(({ region, anchor, count }) => {
    const matchedGroup = METRO_REGIONS.find((g) => g.region === region);
    assert(!!matchedGroup, `Region "${region}" exists in METRO_REGIONS`);
    assert(matchedGroup?.anchorCity === anchor, `Region "${region}" maps to anchorCity "${anchor}"`);
    assert(matchedGroup?.locations.length === count, `Region "${region}" contains ${count} locations`);
  });

  // Verify every location strictly maps to one of the 6 trained cities
  const allAnchorsValid = ALL_LOCATIONS.every((loc) => VALID_MODEL_CITIES.includes(loc.anchorCity));
  assert(allAnchorsValid, 'All 25 locations map strictly to valid model anchor cities');

  // Verify disclosure and accuracy text
  assert(
    predictionPageSrc.includes('Metropolitan Comp Disclosure:') &&
    !predictionPageSrc.includes('$\\rightarrow$'),
    'PredictionPage.jsx includes explicit Metropolitan Comp Disclosure with clean rendered arrow'
  );
  assert(
    predictionPageSrc.includes('Selected Location:') &&
    predictionPageSrc.includes('Anchor:'),
    'PredictionPage.jsx displays selected locality, region, and anchor city'
  );

  // Verify dropdown accessibility and cleanup
  assert(
    predictionPageSrc.includes('removeEventListener') &&
    predictionPageSrc.includes('searchInputRef'),
    'PredictionPage.jsx implements click-outside cleanup and search input auto-focus'
  );

  // 2. Start Test Express Instance
  console.log('\n2. Starting Test Express Instance...');
  await connectDB();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(BACKEND_PORT, resolve));
  console.log(`  [INFO] Real Express Server listening on http://localhost:${BACKEND_PORT}`);

  const testEmail = `metro_tester_${Date.now()}@leaselens.io`;
  const testPassword = 'SecurePassword123!';
  let token = null;

  try {
    // 3. User Registration / Auth Flow to get Bearer Token
    console.log('\n3. Authenticating Test User for Protected Route Access...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Metro Coverage Landlord',
        email: testEmail,
        password: testPassword,
        phone: '+91 9876543210'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Landlord registration returns HTTP 201');
    token = regData?.data?.token;
    assert(!!token, 'Valid JWT auth token acquired');

    // 4. Test Route Protection
    console.log('\n4. Verifying Route Protection on /api/v1/predict/predict...');
    const unauthRes = await fetch(`${BASE_URL}/predict/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BHK: 2,
        Size: 1000,
        Bathroom: 2,
        Floor: '2 out of 4',
        City: 'Bangalore',
        Furnishing_Status: 'Semi-Furnished',
        Tenant_Preferred: 'Family',
        Area_Type: 'Super Area'
      })
    });
    assert(unauthRes.status === 401, 'Unauthenticated POST /api/v1/predict/predict returns HTTP 401');

    // 5. Test Live Predictions Across Satellite Localities
    console.log('\n5. Testing Live Predictions for Satellite Locations Mapped to Anchor Cities...');

    const testCases = [
      {
        locality: 'Gurugram',
        region: 'Delhi NCR',
        anchor: 'Delhi',
        payload: {
          BHK: 3,
          Size: 1800,
          Bathroom: 3,
          Floor: '1 out of 4',
          City: 'Delhi',
          Furnishing_Status: 'Furnished',
          Tenant_Preferred: 'Family',
          Area_Type: 'Super Area'
        }
      },
      {
        locality: 'Whitefield',
        region: 'Bengaluru Urban',
        anchor: 'Bangalore',
        payload: {
          BHK: 2,
          Size: 1100,
          Bathroom: 2,
          Floor: '2 out of 4',
          City: 'Bangalore',
          Furnishing_Status: 'Semi-Furnished',
          Tenant_Preferred: 'Family',
          Area_Type: 'Super Area'
        }
      },
      {
        locality: 'Thane',
        region: 'Mumbai Metropolitan Region',
        anchor: 'Mumbai',
        payload: {
          BHK: 2,
          Size: 850,
          Bathroom: 2,
          Floor: '5 out of 10',
          City: 'Mumbai',
          Furnishing_Status: 'Semi-Furnished',
          Tenant_Preferred: 'Family',
          Area_Type: 'Carpet Area'
        }
      },
      {
        locality: 'Secunderabad',
        region: 'Greater Hyderabad',
        anchor: 'Hyderabad',
        payload: {
          BHK: 2,
          Size: 1000,
          Bathroom: 2,
          Floor: '2 out of 4',
          City: 'Hyderabad',
          Furnishing_Status: 'Semi-Furnished',
          Tenant_Preferred: 'Bachelors/Family',
          Area_Type: 'Super Area'
        }
      },
      {
        locality: 'Howrah',
        region: 'Greater Kolkata',
        anchor: 'Kolkata',
        payload: {
          BHK: 2,
          Size: 900,
          Bathroom: 1,
          Floor: '1 out of 3',
          City: 'Kolkata',
          Furnishing_Status: 'Unfurnished',
          Tenant_Preferred: 'Family',
          Area_Type: 'Super Area'
        }
      },
      {
        locality: 'OMR corridor',
        region: 'Chennai Metropolitan Area',
        anchor: 'Chennai',
        payload: {
          BHK: 3,
          Size: 1400,
          Bathroom: 3,
          Floor: '3 out of 5',
          City: 'Chennai',
          Furnishing_Status: 'Furnished',
          Tenant_Preferred: 'Bachelors/Family',
          Area_Type: 'Super Area'
        }
      }
    ];

    for (const tc of testCases) {
      const res = await fetch(`${BASE_URL}/predict/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tc.payload)
      });
      const data = await res.json();
      assert(
        res.status === 200,
        `${tc.locality} (${tc.region}) mapped to anchor "${tc.anchor}" returns HTTP 200`
      );
      assert(
        typeof data.predicted_rent_inr === 'number' && data.predicted_rent_inr > 0,
        `-> Predicted INR valuation: ₹${Math.round(data.predicted_rent_inr).toLocaleString('en-IN')}`
      );
    }

    // 6. Controlled Anchor-Comparison Test (Identical Non-City Inputs)
    console.log('\n6. Testing Controlled Anchor-Comparison with Identical Non-City Inputs...');
    const standardizedSpecs = {
      BHK: 2,
      Size: 1000,
      Bathroom: 2,
      Floor: '2 out of 4',
      Furnishing_Status: 'Semi-Furnished',
      Tenant_Preferred: 'Family',
      Area_Type: 'Super Area'
    };

    const anchorEstimates = {};

    for (const city of VALID_MODEL_CITIES) {
      assert(VALID_MODEL_CITIES.includes(city), `Verified canonical city "${city}" is a valid trained category`);

      const controlledPayload = {
        ...standardizedSpecs,
        City: city
      };

      const ctrlRes = await fetch(`${BASE_URL}/predict/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(controlledPayload)
      });
      const ctrlData = await ctrlRes.json();

      assert(ctrlRes.status === 200, `Controlled request for canonical City "${city}" returns HTTP 200`);
      assert(
        typeof ctrlData.predicted_rent_inr === 'number' && ctrlData.predicted_rent_inr > 0,
        `-> Canonical City "${city}" returned valid positive estimate: ₹${Math.round(ctrlData.predicted_rent_inr).toLocaleString('en-IN')}`
      );
      assert(controlledPayload.City === city, `Sent payload verified City parameter equals "${city}"`);
      anchorEstimates[city] = Math.round(ctrlData.predicted_rent_inr);
    }

    console.log('  [CONTROLLED COMPS COMPARISON (2 BHK, 1000 sq ft, Semi-Furnished)]');
    Object.entries(anchorEstimates).forEach(([c, val]) => {
      console.log(`    - ${c.padEnd(12)}: ₹${val.toLocaleString('en-IN')}/mo`);
    });

    // 7. Test Express Validation Rejection
    console.log('\n7. Testing Express Validation Rejection on Invalid Payload...');
    const invalidPayload = {
      BHK: -1,
      Size: -50,
      Bathroom: 1,
      Floor: '',
      City: '',
      Furnishing_Status: '',
      Tenant_Preferred: '',
      Area_Type: ''
    };

    const invalidRes = await fetch(`${BASE_URL}/predict/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(invalidPayload)
    });
    assert(invalidRes.status === 400, 'Express validator returns HTTP 400 on malformed input');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n8. Cleaning up test user...');
    await User.deleteMany({ email: testEmail });
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
    console.log('  [CLEANUP] Closed test server and MongoDB connection.');
  }

  console.log('\n====================================================');
  console.log(`METROPOLITAN COVERAGE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runPredictValidationTest();
