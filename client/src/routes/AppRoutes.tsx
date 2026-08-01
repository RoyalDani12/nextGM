import { Routes, Route } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import VerifyEmailNotice from "../features/auth/VerifyEmailNotice";
import DashboardHome from "@/features/shop/DashboardHome";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />

            
            <Route element ={<ProtectedRoute/>}>
            <Route path="/dashboard" element={<DashboardLayout/>}>
              <Route index element={<DashboardHome/>}/>
            </Route>
            </Route>
        </Routes>
    );
}