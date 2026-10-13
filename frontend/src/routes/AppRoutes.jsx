import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';

// Pages
import LandingPage from '../pages/LandingPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';

import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import PropertiesPage from '../pages/properties/PropertiesPage.jsx';
import PropertyDetailPage from '../pages/properties/PropertyDetailPage.jsx';
import PropertyFormPage from '../pages/properties/PropertyFormPage.jsx';

import LeasesPage from '../pages/leases/LeasesPage.jsx';
import LeaseDetailPage from '../pages/leases/LeaseDetailPage.jsx';
import LeaseFormPage from '../pages/leases/LeaseFormPage.jsx';

import ExpensesPage from '../pages/expenses/ExpensesPage.jsx';
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import PredictionPage from '../pages/predictions/PredictionPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Guest / Public-Only Auth Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Landlord Portal Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Properties */}
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/new" element={<PropertyFormPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/properties/:id/edit" element={<PropertyFormPage />} />

          {/* Leases */}
          <Route path="/leases" element={<LeasesPage />} />
          <Route path="/leases/new" element={<LeaseFormPage />} />
          <Route path="/leases/:id" element={<LeaseDetailPage />} />

          {/* Expenses */}
          <Route path="/expenses" element={<ExpensesPage />} />

          {/* Rent Prediction */}
          <Route path="/predict" element={<PredictionPage />} />

          {/* User Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
