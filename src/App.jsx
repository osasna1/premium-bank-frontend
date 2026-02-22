import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import TransactionHistory from "./pages/TransactionHistory";

import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";

import CustomerLayout from "./layouts/CustomerLayout";

// Pay & Transfer pages (make sure these files exist exactly)
import TransfersPage from "./pages/paytransfer/TransfersPage";
import BillsPage from "./pages/paytransfer/BillsPage";
import ETransferPage from "./pages/paytransfer/ETransferPage";
import WireTransferPage from "./pages/paytransfer/WireTransferPage";

function getAuth() {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  return { token, user, isAdmin };
}

function PrivateRoute({ children }) {
  const { token } = getAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { token, isAdmin } = getAuth();
  return token && isAdmin ? children : <Navigate to="/dashboard" replace />;
}

function HomeRedirect() {
  const { token, isAdmin } = getAuth();
  if (!token) return <Navigate to="/login" replace />;
  return isAdmin ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Customer Area (Navbar + Pages) */}
        <Route
          element={
            <PrivateRoute>
              <CustomerLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionHistory />} />

          <Route path="/pay-transfer/transfers" element={<TransfersPage />} />
          <Route path="/pay-transfer/bills" element={<BillsPage />} />
          <Route path="/pay-transfer/etransfer" element={<ETransferPage />} />
          <Route path="/pay-transfer/wire" element={<WireTransferPage />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
