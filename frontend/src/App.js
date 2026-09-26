import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";

import { Toaster } from "sonner";
import { AuthProvider, useAuth, isAdminEmail } from "@/lib/AuthContext";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import VerifyPhone from "@/pages/VerifyPhone";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import GoogleAuthCallback from "@/pages/GoogleAuthCallback";

import AppLayout from "@/components/AppLayout";
import SubGate from "@/components/SubGate";

import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Products from "@/pages/Products";
import Stock from "@/pages/Stock";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Udhaar from "@/pages/Udhaar";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Reports from "@/pages/Reports";
import Expenses from "@/pages/Expenses";
import Settings from "@/pages/Settings";
import Subscribe from "@/pages/Subscribe";
import Billing from "@/pages/Billing";
import AdminSubscriptions from "@/pages/AdminSubscriptions";
import CounterMode from "@/pages/CounterMode";
import PublicStoreDirectory from "@/pages/PublicStoreDirectory";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import Info from "./pages/Info.jsx";
import Careers from "./pages/Careers";
import ProPlanPage from "./pages/ProPlanPage";
import ProStudioPage from "./pages/ProStudioPage";
import StarterPlanPage from "./pages/StarterPlanPage";
import BusinessPlanPage from "./pages/BusinessPlanPage";
import PremiumPlanPage from "./pages/PremiumPlanPage";
import NexoraRoutes from "./nexoraos/App";
import { ThemeProvider } from "./contexts/ThemeContext";
import PublicStoreFront from "./pages/PublicStoreFront";

/* =========================================================
   PROTECTED ROUTES
========================================================= */

export const isSubActive = (sub) => {
  if (!sub) return false;
  const status = (sub.status || "").toLowerCase();
  const isActiveOrTrial = status === "active" || status === "trial" || sub.is_trial === true;
  if (!isActiveOrTrial) return false;
  if (!sub.expires_at) return true;
  const expTime = new Date(sub.expires_at).getTime();
  return !isNaN(expTime) && expTime > Date.now();
};

function Protected({ children }) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }

  // Admin should only see Admin Portal unless actively running Store Inspector mode
  const isInspector = !!sessionStorage.getItem("dukaan_inspector_mode");
  if (!isInspector && (user.is_admin || isAdminEmail(user.email))) {
    return <Navigate to="/admin" replace />;
  }

  // Strict Gate 1: If email is not verified, redirect to email verification
  if (user.is_verified === false || user.email_verified === false) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || "")}`} replace />;
  }

  // Strict Gate 2: If phone is not verified, redirect to mobile OTP verification
  if (!user.phone_verified) {
    return <Navigate to={`/verify-phone?email=${encodeURIComponent(user.email || "")}`} replace />;
  }

  // Subscription access is decided by server-fetched user state only.
  const hasActiveSub = Boolean(isSubActive(user.subscription));
  if (!hasActiveSub) {
    return <Navigate to="/subscribe" replace />;
  }

  return children;
}


/* =========================================================
   LAUNCH ROUTE CONTROLLER
========================================================= */

export const isStandaloneApp = () => {
  if (typeof window === "undefined") return false;
  // Electron desktop app
  if (window.navigator?.userAgent?.includes("DukaanDesktop") || window.isElectron) return true;
  // Capacitor / Cordova / Native Android
  if (window.Capacitor?.isNativePlatform() || window.AndroidBridge) return true;
  // PWA Standalone Mode
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.navigator?.standalone) return true;
  // App mode flag in URL or localStorage
  if (window.location?.search?.includes("app_mode=1")) {
    try { localStorage.setItem("dukaan_app_mode", "1"); } catch {}
    return true;
  }
  try {
    if (localStorage.getItem("dukaan_app_mode") === "1") return true;
  } catch {}
  return false;
};

function SubscribeRoute() {
  return <Subscribe />;
}

function LaunchController() {
  const location = useLocation();
  const isApp = isStandaloneApp();

  return (
    <Routes>

      {/* ===================================================
          PUBLIC PAGES / APP ROOT
      =================================================== */}

      <Route
        path="/"
        element={isApp ? <Navigate to="/app" replace /> : <Landing />}
      />

      <Route
        path="/landing"
        element={<Landing />}
      />

      <Route
        path="/info"
        element={<Info />}
      />

      <Route
        path="/privacy-policy"
        element={<PrivacyPolicy />}
      />

      <Route
        path="/refund-policy"
        element={<RefundPolicy />}
      />

      {/* ===================================================
          CAREERS & WE'RE HIRING PORTAL
      =================================================== */}
      <Route
        path="/careers"
        element={<Careers />}
      />
      <Route
        path="/hiring"
        element={<Careers />}
      />
      <Route
        path="/pro-plan"
        element={<ProPlanPage />}
      />
      <Route
        path="/pro"
        element={<ProPlanPage />}
      />
      <Route
        path="/pro-studio"
        element={<ProStudioPage />}
      />
      <Route
        path="/studio"
        element={<ProStudioPage />}
      />
      <Route
        path="/starter-plan"
        element={<StarterPlanPage />}
      />
      <Route
        path="/starter"
        element={<StarterPlanPage />}
      />
      <Route
        path="/business-plan"
        element={<BusinessPlanPage />}
      />
      <Route
        path="/business"
        element={<BusinessPlanPage />}
      />
      <Route
        path="/premium-plan"
        element={<PremiumPlanPage />}
      />
      <Route
        path="/premium"
        element={<PremiumPlanPage />}
      />

      {/* ===================================================
          AUTH (Temporarily bypassed - redirect to /app)
      =================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />

      <Route
        path="/verify-phone"
        element={<VerifyPhone />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      <Route
        path="/auth/google/callback"
        element={<GoogleAuthCallback />}
      />

      <Route
        path="/auth/callback"
        element={<GoogleAuthCallback />}
      />

      <Route
        path="/subscribe"
        element={<SubscribeRoute />}
      />

      <Route
        path="/stores"
        element={<PublicStoreDirectory />}
      />

      {/* ===================================================
          DUKAAN 3.0 OMNICHANNEL CONSUMER STOREFRONT
      =================================================== */}
      <Route
        path="/store"
        element={<PublicStoreFront />}
      />
      <Route
        path="/store/:shopSlug"
        element={<PublicStoreFront />}
      />

      {/* ===================================================
          NEXORAOS CAFÉ OPERATIONS SUITE (officialdukaan.in/nexoraos)
      =================================================== */}
      <Route
        path="/nexoraos/*"
        element={<NexoraRoutes />}
      />
      <Route
        path="/order"
        element={<Navigate to="/nexoraos/order" replace />}
      />
      <Route
        path="/tv"
        element={<Navigate to="/nexoraos/tv" replace />}
      />

      <Route
        path="/mobile"
        element={<Navigate to="/app" replace />}
      />

      {/* ===================================================
          MASTER ADMIN PORTAL (Standalone Layout & Security)
      =================================================== */}

      <Route
        path="/admin"
        element={<AdminSubscriptions />}
      />

      <Route
        path="/app/admin"
        element={<Navigate to="/admin" replace />}
      />


      {/* ===================================================
          PROTECTED MERCHANT APP
      =================================================== */}

      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >

        {/* Dashboard */}

        <Route
          path="/app"
          element={
            <SubGate>
              <Dashboard />
            </SubGate>
          }
        />


        {/* POS */}

        <Route
          path="/app/pos"
          element={
            <SubGate>
              <POS />
            </SubGate>
          }
        />


        {/* Products */}

        <Route
          path="/app/products"
          element={
            <SubGate>
              <Products />
            </SubGate>
          }
        />


        {/* Stock */}

        <Route
          path="/app/stock"
          element={
            <SubGate>
              <Stock />
            </SubGate>
          }
        />


        {/* Customers */}

        <Route
          path="/app/customers"
          element={
            <SubGate>
              <Customers />
            </SubGate>
          }
        />


        {/* Customer Detail */}

        <Route
          path="/app/customers/:id"
          element={
            <SubGate>
              <CustomerDetail />
            </SubGate>
          }
        />


        {/* Udhaar */}

        <Route
          path="/app/udhaar"
          element={
            <SubGate>
              <Udhaar />
            </SubGate>
          }
        />


        {/* Orders */}

        <Route
          path="/app/orders"
          element={
            <SubGate>
              <Orders />
            </SubGate>
          }
        />


        {/* Order Detail */}

        <Route
          path="/app/orders/:id"
          element={
            <SubGate>
              <OrderDetail />
            </SubGate>
          }
        />


        {/* Expenses */}
        <Route
          path="/app/expenses"
          element={
            <SubGate>
              <Expenses />
            </SubGate>
          }
        />

        {/* Reports */}
        <Route
          path="/app/reports"
          element={
            <SubGate>
              <Reports />
            </SubGate>
          }
        />


        {/* Settings */}
        <Route
          path="/app/settings"
          element={
            <Settings />
          }
        />

        {/* Dukaan Pro Studio Shortcut Routes */}
        <Route
          path="/app/studio"
          element={
            <Settings initialTab="pro" />
          }
        />
        <Route
          path="/app/pro"
          element={
            <Settings initialTab="pro" />
          }
        />


        {/* Billing */}

        <Route
          path="/app/billing"
          element={
            <Billing />
          }
        />




        {/* =================================================
            COUNTER MODE
        ================================================= */}

        <Route
          path="/app/counter"
          element={
            <CounterMode />
          }
        />

      </Route>


      {/* ===================================================
          UNKNOWN ROUTE
      =================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


/* =========================================================
   MAIN APP
========================================================= */

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Global Gen-Z Analog Film Grain Texture Overlay */}
        <div className="noise-overlay" aria-hidden="true" />

        <BrowserRouter>

          <Toaster
            position="top-center"
            richColors
          />

          <LaunchController />

        </BrowserRouter>

      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;