import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Lease from '../models/Lease.js';
import Expense from '../models/Expense.js';

const DEMO_USER = {
  name: 'LeaseLens Demo User',
  email: 'leaselens.demo@example.com',
  passwordPlain: 'LeaseLensDemo@2026',
  phone: '+91 98450 12345',
  role: 'user'
};

const PROPERTIES_DATA = [
  // ==========================================
  // BENGALURU URBAN (Anchor: Bangalore)
  // ==========================================
  {
    key: 'blr_1',
    title: 'Sobha Dream Acres, Tower 4, Flat 1204',
    propertyType: 'Apartment',
    address: {
      street: 'Tower 4, Flat 1204, Balagere Main Road',
      locality: 'Panathur / Balagere',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560087'
    },
    bhk: 2,
    areaSqFt: 1050,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: true,
    amenities: ['Clubhouse', 'Swimming Pool', 'Gym', '24x7 Security', 'Power Backup', 'EV Charging Point'],
    description: 'Modern 2 BHK corner apartment in high-rise township with panoramic lake view, modular kitchen, and covered basement car park.',
    listedRent: 32000,
    status: 'Rented',
    lease: {
      tenant: {
        name: 'Rajesh Kumar & Divya Rajesh',
        email: 'rajesh.kumar@techcorp.in',
        phone: '+91 98451 23456',
        occupantsCount: 2
      },
      monthlyRent: 32000,
      securityDeposit: 120000,
      monthOffsetStart: -4,
      monthOffsetEnd: 8,
      paymentDueDay: 5,
      noticePeriodDays: 30,
      status: 'Active',
      importantTerms: ['Maintenance charges payable directly to society', 'No alterations to fixed fixtures']
    },
    expenses: [
      { title: 'Monthly Society Maintenance & Water Surcharge', category: 'Maintenance', amount: 3800, dayOffset: -12, isRecurring: true, notes: 'Society invoice #SD-2026-09' },
      { title: 'BESCOM High-Tension Electricity Bill', category: 'Electricity', amount: 1950, dayOffset: -8, isRecurring: true, notes: 'Paid online via BESCOM portal' },
      { title: 'ACT Fibernet 300Mbps High-Speed Broadband', category: 'Internet', amount: 999, dayOffset: -5, isRecurring: true, notes: 'Auto-debit mandate' }
    ]
  },
  {
    key: 'blr_2',
    title: 'Prestige Shantiniketan Executive Suite',
    propertyType: 'Apartment',
    address: {
      street: 'Tower 12, Unit 802, ITPL Main Road',
      locality: 'Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066'
    },
    bhk: 3,
    areaSqFt: 1750,
    bedrooms: 3,
    bathrooms: 3,
    furnishingStatus: 'Furnished',
    parking: true,
    amenities: ['Direct Mall Access', 'Tennis Court', 'High-Speed Elevators', 'Clubhouse', 'Children Play Area', 'Piped Gas'],
    description: 'Spacious, designer 3 BHK overlooking central landscaped greens in Whitefield tech corridor. Ideal for senior IT executives.',
    listedRent: 58000,
    status: 'Available',
    lease: {
      tenant: {
        name: 'Priya Sharma',
        email: 'priya.sharma@consulting.com',
        phone: '+91 97412 88990',
        occupantsCount: 3
      },
      monthlyRent: 55000,
      securityDeposit: 200000,
      monthOffsetStart: -12,
      monthOffsetEnd: -1,
      paymentDueDay: 1,
      noticePeriodDays: 60,
      status: 'Expired',
      importantTerms: ['Professional tenant handover completed', 'Security deposit settled in full']
    },
    expenses: [
      { title: 'Deep Cleaning & Interior Wall Touchup', category: 'Repairs', amount: 6500, dayOffset: -15, isRecurring: false, notes: 'Post-tenancy turnaround for prospective tenants' },
      { title: 'Prestige Society Monthly Maintenance', category: 'Maintenance', amount: 5200, dayOffset: -10, isRecurring: true, notes: 'Prestige Management Committee dues' },
      { title: 'Water Tanker & Municipal Surcharge', category: 'Water', amount: 850, dayOffset: -3, isRecurring: false, notes: 'Summer supplemental supply' }
    ]
  },

  // ==========================================
  // CHENNAI METROPOLITAN AREA (Anchor: Chennai)
  // ==========================================
  {
    key: 'chn_1',
    title: 'Hiranandani Upscale Oceanview Residence',
    propertyType: 'Apartment',
    address: {
      street: 'Bayview Tower, Flat 1801, Rajiv Gandhi Salai (OMR)',
      locality: 'Egattur, OMR corridor',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '603103'
    },
    bhk: 3,
    areaSqFt: 1650,
    bedrooms: 3,
    bathrooms: 3,
    furnishingStatus: 'Furnished',
    parking: true,
    amenities: ['Sea View Balcony', 'Infinity Pool', 'Gym', 'Badminton Court', '24/7 Security', 'RO Water System'],
    description: 'High-floor 3 BHK with East-facing Bay of Bengal panoramic view, Italian marble flooring, and modular European fittings.',
    listedRent: 44000,
    status: 'Rented',
    lease: {
      tenant: {
        name: 'Karthik Subramanian',
        email: 'karthik.subramanian@autoengineering.co.in',
        phone: '+91 98401 54321',
        occupantsCount: 3
      },
      monthlyRent: 44000,
      securityDeposit: 150000,
      monthOffsetStart: -6,
      monthOffsetEnd: 6,
      paymentDueDay: 1,
      noticePeriodDays: 30,
      status: 'Active',
      importantTerms: ['Tenant covers internal electrical fixture maintenance', 'Air conditioning servicing twice yearly']
    },
    expenses: [
      { title: 'Hiranandani Residents Association Maintenance', category: 'Maintenance', amount: 4200, dayOffset: -18, isRecurring: true, notes: 'Monthly estate maintenance charge' },
      { title: 'TANGEDCO Electricity Outlay', category: 'Electricity', amount: 2800, dayOffset: -11, isRecurring: true, notes: 'Bi-monthly consumption bill' },
      { title: 'Purified Water Supply Canisters', category: 'Water', amount: 1100, dayOffset: -4, isRecurring: true, notes: 'Potable water supply' }
    ]
  },
  {
    key: 'chn_2',
    title: 'Appaswamy Platina Green Haven',
    propertyType: 'Apartment',
    address: {
      street: 'Block C, Unit 304, Mount Poonamallee High Road',
      locality: 'Porur',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600116'
    },
    bhk: 2,
    areaSqFt: 1120,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: true,
    amenities: ['Covered Parking', 'Gated Community', 'Landscape Garden', 'CCTV', 'Intercom'],
    description: 'Well-ventilated 2 BHK close to DLF Cybercity Porur and major hospitals. Features teakwood wardrobes and modular kitchen.',
    listedRent: 26000,
    status: 'Available',
    lease: {
      tenant: {
        name: 'Sneha Rangarajan',
        email: 'sneha.r@fintechhub.com',
        phone: '+91 98840 91234',
        occupantsCount: 2
      },
      monthlyRent: 26000,
      securityDeposit: 100000,
      monthOffsetStart: 1,
      monthOffsetEnd: 13,
      paymentDueDay: 5,
      noticePeriodDays: 30,
      status: 'Upcoming',
      importantTerms: ['Lease commencing 1st of upcoming calendar month', 'Advance token deposit credited']
    },
    expenses: [
      { title: 'Daikin Dual Inverter AC Comprehensive Servicing', category: 'Repairs', amount: 2200, dayOffset: -22, isRecurring: false, notes: 'Gas recharge and coil cleaning prior to new move-in' },
      { title: 'Platina Owners Association Society Dues', category: 'Maintenance', amount: 3100, dayOffset: -9, isRecurring: true, notes: 'Monthly regular upkeep' }
    ]
  },

  // ==========================================
  // DELHI NCR (Anchor: Delhi)
  // ==========================================
  {
    key: 'del_1',
    title: 'DLF Phase 5 Ultra Luxury Apartment',
    propertyType: 'Apartment',
    address: {
      street: 'Tower 2, Flat 1401, Golf Course Road',
      locality: 'Gurugram',
      city: 'Delhi',
      state: 'Haryana / NCR',
      pincode: '122002'
    },
    bhk: 4,
    areaSqFt: 2800,
    bedrooms: 4,
    bathrooms: 4,
    furnishingStatus: 'Furnished',
    parking: true,
    amenities: ['Golf Course View', 'Private Concierge', 'Valet Parking', 'Heated Pool', 'Smart Home Automation', 'Power Backup'],
    description: 'Premier 4 BHK luxury condominium in the heart of Millennium City with Italian marble, VRV climate control, and separate staff quarters.',
    listedRent: 120000,
    status: 'Rented',
    lease: {
      tenant: {
        name: 'Vikramaditya & Rohini Malhotra',
        email: 'vikram.malhotra@globalprivateequity.com',
        phone: '+91 98110 33445',
        occupantsCount: 4
      },
      monthlyRent: 120000,
      securityDeposit: 360000,
      monthOffsetStart: -2,
      monthOffsetEnd: 10,
      paymentDueDay: 1,
      noticePeriodDays: 60,
      status: 'Active',
      importantTerms: ['Quarterly pest control mandatory', 'Subletting or commercial use strictly prohibited']
    },
    expenses: [
      { title: 'DLF Phase 5 Club & Estate Maintenance Levy', category: 'Maintenance', amount: 12500, dayOffset: -14, isRecurring: true, notes: 'Quarterly estate upkeep assessment' },
      { title: 'DHBVN Smart Meter Power Billing', category: 'Electricity', amount: 7800, dayOffset: -7, isRecurring: true, notes: 'Summer VRV central air cooling bills' },
      { title: 'Indraprastha Gas Limited (IGL) Piped Gas Connection', category: 'Other', amount: 1450, dayOffset: -2, isRecurring: true, notes: 'Bi-monthly metered PNG supply' }
    ]
  },
  {
    key: 'del_2',
    title: 'Godrej Woods Serenity Residence',
    propertyType: 'Apartment',
    address: {
      street: 'Oak Tower, Flat 602, Sector 43',
      locality: 'Noida',
      city: 'Delhi',
      state: 'Uttar Pradesh / NCR',
      pincode: '201303'
    },
    bhk: 2,
    areaSqFt: 1180,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: true,
    amenities: ['Urban Forest Theme', 'Clubhouse', 'Gymnasium', 'EV Charging Station', 'Badminton Court'],
    description: 'Tranquil 2 BHK surrounded by lush foliage and elevated green walkways. Minutes from Noida Golf Course and Delhi metro line.',
    listedRent: 35000,
    status: 'Available',
    lease: null,
    expenses: [
      { title: 'Godrej Woods RWA Monthly Maintenance', category: 'Maintenance', amount: 3600, dayOffset: -20, isRecurring: true, notes: 'Regular facility management fee' },
      { title: 'Sanitary & Concealed Plumbing Line Repair', category: 'Repairs', amount: 4200, dayOffset: -13, isRecurring: false, notes: 'Guest bathroom flush valve replacement' },
      { title: 'NOIDA Municipal Authority Water Tax Assessment', category: 'Taxes', amount: 900, dayOffset: -6, isRecurring: false, notes: 'Half-yearly municipal sewer and water tax' }
    ]
  },

  // ==========================================
  // GREATER HYDERABAD (Anchor: Hyderabad)
  // ==========================================
  {
    key: 'hyd_1',
    title: 'My Home Bhooja Sky Suite',
    propertyType: 'Apartment',
    address: {
      street: 'Block D, Flat 2102, Hitec City Main Road',
      locality: 'Gachibowli',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500032'
    },
    bhk: 3,
    areaSqFt: 2150,
    bedrooms: 3,
    bathrooms: 3,
    furnishingStatus: 'Furnished',
    parking: true,
    amenities: ['Sky Lounge', 'Olympic Size Pool', 'Squash Court', '24x7 Security', 'High Speed Elevators', 'EV Charging'],
    description: 'Iconic 3 BHK sky apartment adjacent to Hyderabad Biodiversity Park. Features expansive sit-out balconies and premium woodwork.',
    listedRent: 72000,
    status: 'Rented',
    lease: {
      tenant: {
        name: 'Arjun Reddy & Dr. Meera Reddy',
        email: 'arjun.reddy@hyderabadbiotech.org',
        phone: '+91 99890 11223',
        occupantsCount: 3
      },
      monthlyRent: 72000,
      securityDeposit: 216000,
      monthOffsetStart: -3,
      monthOffsetEnd: 9,
      paymentDueDay: 3,
      noticePeriodDays: 30,
      status: 'Active',
      importantTerms: ['Tenant covers clubhouse subscription fee', 'Reserved tandem parking slot #B2-44']
    },
    expenses: [
      { title: 'My Home Bhooja Premium Estate Maintenance', category: 'Maintenance', amount: 6400, dayOffset: -16, isRecurring: true, notes: 'Includes common clubhouse and green zone care' },
      { title: 'TSSPDCL Domestic Electricity Consumption', category: 'Electricity', amount: 3600, dayOffset: -9, isRecurring: true, notes: 'Online bill settlement' },
      { title: 'Airtel Xstream Fiber 1Gbps Plan', category: 'Internet', amount: 1299, dayOffset: -1, isRecurring: true, notes: 'Broadband connection charges' }
    ]
  },
  {
    key: 'hyd_2',
    title: 'Aparna Sarovar Zenith Lakefront',
    propertyType: 'Apartment',
    address: {
      street: 'Block L, Unit 503, Citizen Hospital Road',
      locality: 'Nallagandla / Financial District',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500019'
    },
    bhk: 2,
    areaSqFt: 1290,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: true,
    amenities: ['Lakefront Jogging Track', 'Tennis Court', 'Supermarket on premises', 'Power Backup', 'Creche'],
    description: 'Lakeside 2 BHK apartment in prime residential cluster near the Financial District and US Consulate. Calm and serene community.',
    listedRent: 36000,
    status: 'Under Maintenance',
    lease: null,
    expenses: [
      { title: 'Master Bathroom Polyurethane Waterproofing', category: 'Repairs', amount: 14500, dayOffset: -10, isRecurring: false, notes: 'Waterproofing warranty contractor invoice' },
      { title: 'Full Apartment Wall Acrylic Emulsion Repainting', category: 'Repairs', amount: 18000, dayOffset: -5, isRecurring: false, notes: 'Asian Paints Royale renovation package' },
      { title: 'Aparna Sarovar RWA Regular Maintenance', category: 'Maintenance', amount: 3900, dayOffset: -2, isRecurring: true, notes: 'Monthly estate maintenance' }
    ]
  },

  // ==========================================
  // GREATER KOLKATA (Anchor: Kolkata)
  // ==========================================
  {
    key: 'kol_1',
    title: 'Mani Imperial Skyline Residency',
    propertyType: 'Apartment',
    address: {
      street: 'Tower 1, Flat 1502, EM Bypass',
      locality: 'Salt Lake',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700054'
    },
    bhk: 3,
    areaSqFt: 1820,
    bedrooms: 3,
    bathrooms: 3,
    furnishingStatus: 'Furnished',
    parking: true,
    amenities: ['Rooftop Swimming Pool', 'Gym', 'Banquet Hall', '24/7 Surveillance', 'Lush Green Courtyard'],
    description: 'Upscale 3 BHK residence with unhindered East Kolkata wetlands view, contemporary wooden finishes, and modular kitchen appliances.',
    listedRent: 48000,
    status: 'Rented',
    lease: {
      tenant: {
        name: 'Sourav Banerjee',
        email: 'sourav.banerjee@easternshipping.com',
        phone: '+91 98300 77889',
        occupantsCount: 3
      },
      monthlyRent: 48000,
      securityDeposit: 140000,
      monthOffsetStart: -5,
      monthOffsetEnd: 7,
      paymentDueDay: 1,
      noticePeriodDays: 45,
      status: 'Active',
      importantTerms: ['Tenant covers internal electrical wear', 'Designated parking slot #P-12']
    },
    expenses: [
      { title: 'Mani Imperial Condominium Society Maintenance', category: 'Maintenance', amount: 4500, dayOffset: -15, isRecurring: true, notes: 'Monthly upkeep and security maintenance' },
      { title: 'CESC Limited Electricity Billing', category: 'Electricity', amount: 3100, dayOffset: -8, isRecurring: true, notes: 'Consumer bill #CESC-78901' },
      { title: 'Central RO Drinking Water Plant Servicing', category: 'Water', amount: 1600, dayOffset: -3, isRecurring: false, notes: 'Filter candle replacement' }
    ]
  },
  {
    key: 'kol_2',
    title: 'Action Area II Smart City Home',
    propertyType: 'Apartment',
    address: {
      street: 'Greenfield City, Block B, Unit 401, Major Arterial Road',
      locality: 'Rajarhat / New Town',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700156'
    },
    bhk: 2,
    areaSqFt: 980,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: true,
    amenities: ['Eco Park Proximity', 'Solar Powered Common Lighting', 'Gated Security', 'Community Hall'],
    description: 'Charming 2 BHK flat near Eco Park and New Town IT hub. Fitted with energy-efficient LED fittings, ceiling fans, and modular granite counter.',
    listedRent: 22000,
    status: 'Available',
    lease: null,
    expenses: [
      { title: 'New Town Residential Welfare Association Dues', category: 'Maintenance', amount: 2400, dayOffset: -19, isRecurring: true, notes: 'Monthly society upkeep' },
      { title: 'Balcony Safety Grill Weatherproof Painting', category: 'Repairs', amount: 3200, dayOffset: -12, isRecurring: false, notes: 'Anti-rust primer and enamel coat' },
      { title: 'NKDA Municipal Property Tax (Q2 & Q3)', category: 'Taxes', amount: 4800, dayOffset: -4, isRecurring: false, notes: 'New Town Kolkata Development Authority tax' }
    ]
  },

  // ==========================================
  // MUMBAI METROPOLITAN REGION (Anchor: Mumbai)
  // ==========================================
  {
    key: 'mum_1',
    title: 'Rustomjee Crown Luxury Haven',
    propertyType: 'Apartment',
    address: {
      street: 'Tower A, Flat 2403, Gokhale Road South',
      locality: 'Prabhadevi / Bandra West Corridor',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400025'
    },
    bhk: 3,
    areaSqFt: 1720,
    bedrooms: 3,
    bathrooms: 3,
    furnishingStatus: 'Furnished',
    parking: true,
    amenities: ['Sea Link View', 'Concierge Desk', 'Heated Indoor Pool', 'State-of-Art Gym', 'Multi-tier Security', 'Valet'],
    description: 'Ultra-luxurious 3 BHK with bespoke Italian furnishings, floor-to-ceiling soundproof glazing, and mesmerizing Arabian Sea vistas.',
    listedRent: 165000,
    status: 'Rented',
    lease: {
      tenant: {
        name: 'Devendra Shroff & Natasha Shroff',
        email: 'devendra.shroff@mumbaifinance.in',
        phone: '+91 98200 44556',
        occupantsCount: 4
      },
      monthlyRent: 165000,
      securityDeposit: 500000,
      monthOffsetStart: -1,
      monthOffsetEnd: 11,
      paymentDueDay: 1,
      noticePeriodDays: 60,
      status: 'Active',
      importantTerms: ['Tenant covers society transfer fees', '2 dedicated automated podium parking spots']
    },
    expenses: [
      { title: 'Rustomjee Crown Co-operative Housing Society Maintenance', category: 'Maintenance', amount: 16000, dayOffset: -10, isRecurring: true, notes: 'Premium amenities and concierge billing' },
      { title: 'Adani Electricity Mumbai High-Tension Bill', category: 'Electricity', amount: 6500, dayOffset: -6, isRecurring: true, notes: 'Residential power consumption' },
      { title: 'Tata Play Fiber 500Mbps Business Tier Internet', category: 'Internet', amount: 2100, dayOffset: -2, isRecurring: true, notes: 'Dedicated leased-grade broadband' }
    ]
  },
  {
    key: 'mum_2',
    title: 'Lodha Amara Serene Haven',
    propertyType: 'Apartment',
    address: {
      street: 'Tower 7, Unit 1104, Kolshet Road',
      locality: 'Thane',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400607'
    },
    bhk: 2,
    areaSqFt: 890,
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Semi-Furnished',
    parking: true,
    amenities: ['Grand Clubhouse', 'Cricket Pitch', 'Swimming Pool', 'Tree-Lined Avenues', 'Gated Security'],
    description: 'Smart 2 BHK within a premier 40-acre residential ecosystem in Thane. Excellent connectivity to Eastern Express Highway and Viviana Mall.',
    listedRent: 38000,
    status: 'Available',
    lease: null,
    expenses: [
      { title: 'Lodha Amara Complex Monthly Maintenance', category: 'Maintenance', amount: 3900, dayOffset: -18, isRecurring: true, notes: 'Society maintenance dues' },
      { title: 'Professional Post-Handover Deep Sanitization', category: 'Repairs', amount: 4500, dayOffset: -11, isRecurring: false, notes: 'Kitchen chimney, tile scrubbing, and fumigation' },
      { title: 'Godrej Main Door Smart Lock Installation', category: 'Repairs', amount: 1800, dayOffset: -4, isRecurring: false, notes: 'New digital keypad latch for security' }
    ]
  }
];

const PORTFOLIO_EXPENSES = [
  {
    title: 'FY 2025-2026 Comprehensive Multi-Property Fire & Allied Perils Insurance',
    category: 'Taxes',
    amount: 38000,
    dayOffset: -30,
    isRecurring: false,
    notes: 'Underwritten by ICICI Lombard; covers structural and fixture assets across all 12 portfolio properties'
  },
  {
    title: 'Annual Legal & Chartered Accountancy Retainer for Rental Contracts',
    category: 'Other',
    amount: 15000,
    dayOffset: -20,
    isRecurring: false,
    notes: 'Legal vetting of lease deeds, digital stamping, and tax deduction compliance'
  }
];

export async function seedDemoData() {
  console.log('========================================================');
  console.log('   LEASELENS REALISTIC DEMO DATA SEEDING ENGINE         ');
  console.log('========================================================\n');

  await connectDB();

  try {
    // 1. Locate or create Demo User
    let demoUser = await User.findOne({ email: DEMO_USER.email });

    const passwordHash = await User.hashPassword(DEMO_USER.passwordPlain);

    if (demoUser) {
      console.log(`[Demo Seed] Found existing demo user (ID: ${demoUser._id}). Cleaning previous portfolio records...`);
      demoUser.name = DEMO_USER.name;
      demoUser.phone = DEMO_USER.phone;
      demoUser.passwordHash = passwordHash;
      await demoUser.save();

      // Clean up previous demo records to ensure idempotency
      const deleteLeases = await Lease.deleteMany({ userId: demoUser._id });
      const deleteExpenses = await Expense.deleteMany({ userId: demoUser._id });
      const deleteProperties = await Property.deleteMany({ userId: demoUser._id });

      console.log(`[Demo Seed] Cleaned up ${deleteProperties.deletedCount} properties, ${deleteLeases.deletedCount} leases, ${deleteExpenses.deletedCount} expenses.`);
    } else {
      console.log(`[Demo Seed] Creating fresh demo user: ${DEMO_USER.email}`);
      demoUser = await User.create({
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        passwordHash,
        phone: DEMO_USER.phone,
        role: DEMO_USER.role
      });
      console.log(`[Demo Seed] Demo user created (ID: ${demoUser._id}).`);
    }

    const today = new Date();

    // 2. Insert 12 Realistic Properties
    console.log(`\n[Demo Seed] Inserting 12 realistic rental properties across 6 canonical cities...`);
    const createdProperties = {};
    let createdLeasesCount = 0;
    let createdExpensesCount = 0;

    for (const propData of PROPERTIES_DATA) {
      const property = await Property.create({
        userId: demoUser._id,
        title: propData.title,
        propertyType: propData.propertyType,
        address: propData.address,
        bhk: propData.bhk,
        areaSqFt: propData.areaSqFt,
        bedrooms: propData.bedrooms,
        bathrooms: propData.bathrooms,
        furnishingStatus: propData.furnishingStatus,
        parking: propData.parking,
        amenities: propData.amenities,
        description: propData.description,
        listedRent: propData.listedRent,
        status: propData.status
      });

      createdProperties[propData.key] = property;
      console.log(`  + Property: "${property.title}" [${property.address.city} - ${property.status}]`);

      // 3. Insert Lease if defined
      if (propData.lease) {
        const lData = propData.lease;
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() + lData.monthOffsetStart);
        const endDate = new Date(today);
        endDate.setMonth(today.getMonth() + lData.monthOffsetEnd);

        await Lease.create({
          userId: demoUser._id,
          propertyId: property._id,
          tenant: lData.tenant,
          monthlyRent: lData.monthlyRent,
          securityDeposit: lData.securityDeposit,
          startDate,
          endDate,
          noticePeriodDays: lData.noticePeriodDays,
          paymentDueDay: lData.paymentDueDay,
          status: lData.status,
          importantTerms: lData.importantTerms,
          notes: `Lease generated for demo walkthrough: ${property.title}`
        });
        createdLeasesCount++;
      }

      // 4. Insert itemized Property Expenses
      if (propData.expenses && propData.expenses.length > 0) {
        for (const exp of propData.expenses) {
          const expenseDate = new Date(today);
          expenseDate.setDate(today.getDate() + exp.dayOffset);

          await Expense.create({
            userId: demoUser._id,
            propertyId: property._id,
            title: exp.title,
            category: exp.category,
            amount: exp.amount,
            expenseDate,
            isRecurringMonthly: exp.isRecurring,
            notes: exp.notes
          });
          createdExpensesCount++;
        }
      }
    }

    // 5. Insert Portfolio-Wide Unassigned Expenses
    console.log(`\n[Demo Seed] Inserting portfolio-wide operating expenses...`);
    for (const pExp of PORTFOLIO_EXPENSES) {
      const expDate = new Date(today);
      expDate.setDate(today.getDate() + pExp.dayOffset);

      await Expense.create({
        userId: demoUser._id,
        propertyId: null,
        title: pExp.title,
        category: pExp.category,
        amount: pExp.amount,
        expenseDate: expDate,
        isRecurringMonthly: pExp.isRecurring,
        notes: pExp.notes
      });
      createdExpensesCount++;
      console.log(`  + Portfolio Expense: "${pExp.title}" (₹${pExp.amount.toLocaleString('en-IN')})`);
    }

    // 6. Aggregate Verification
    const propCount = await Property.countDocuments({ userId: demoUser._id });
    const leaseCount = await Lease.countDocuments({ userId: demoUser._id });
    const expenseDocs = await Expense.find({ userId: demoUser._id });
    const totalOutlay = expenseDocs.reduce((acc, curr) => acc + curr.amount, 0);

    const activeLeases = await Lease.countDocuments({ userId: demoUser._id, status: 'Active' });
    const upcomingLeases = await Lease.countDocuments({ userId: demoUser._id, status: 'Upcoming' });
    const expiredLeases = await Lease.countDocuments({ userId: demoUser._id, status: 'Expired' });

    console.log('\n========================================================');
    console.log('   DEMO PORTFOLIO SEEDED SUCCESSFULLY!                  ');
    console.log('========================================================');
    console.log(`Demo Account Credentials:`);
    console.log(`  - Email:    ${DEMO_USER.email}`);
    console.log(`  - Password: ${DEMO_USER.passwordPlain}`);
    console.log(`  - Role:     ${DEMO_USER.role}`);
    console.log(`\nRecord Metrics:`);
    console.log(`  - Properties:     ${propCount} (2 each in Bangalore, Chennai, Delhi, Hyderabad, Kolkata, Mumbai)`);
    console.log(`  - Leases:         ${leaseCount} (Active: ${activeLeases}, Upcoming: ${upcomingLeases}, Expired: ${expiredLeases})`);
    console.log(`  - Total Expenses: ${expenseDocs.length} entries`);
    console.log(`  - Total Outlay:   ₹${totalOutlay.toLocaleString('en-IN')}`);
    console.log('========================================================\n');

    return {
      success: true,
      demoEmail: DEMO_USER.email,
      demoPassword: DEMO_USER.passwordPlain,
      properties: propCount,
      leases: leaseCount,
      expenses: expenseDocs.length,
      totalOutlay
    };
  } catch (err) {
    console.error('[Demo Seed Error]:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
}

// Direct execution if run from CLI
if (process.argv[1]?.endsWith('seedDemoData.js')) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
