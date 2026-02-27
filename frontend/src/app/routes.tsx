import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "../pages/landing_page/Landing";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Dashboard from "../pages/dashboard/Dashboard";
import UploadBill from "../pages/upload/UploadBill";
import Expenses from "../pages/expenses/Expenses";
import TaxSummaryPage from "../pages/tax/TaxSummaryPage";

export const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<UploadBill />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/tax-summary" element={<TaxSummaryPage />} />
    </Routes>
  </BrowserRouter>
);
