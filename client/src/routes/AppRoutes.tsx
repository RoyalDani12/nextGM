import { Routes, Route } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import VerifyEmailNotice from "../features/auth/VerifyEmailNotice";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage";
import { DashboardHome } from "@/features/shop/DashboardHome";
import ProtectedRoute from "./ProtectedRoute";
import { Home } from "@/features/pages/public/Home";
import { DashboardLayout } from "@/features/shop/DashboardLayout";
import SettingsPage from "../features/users/SettingsPage";
import { ForgetPassword } from "@/features/auth/ForgetPassword";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import RoleRedirect from "./RoleRedirect";
import { SuperAdminHome } from "@/features/pages/superAdmin/SuperAdminHome";
import { AdminLayout } from "@/features/pages/superAdmin/AdminLayout";
import { CreateShopPage } from "@/features/shop/CreateShopPage";
import Pricing from "@/features/pages/public/Pricing";
import { Shops } from "@/features/shop/Shops";
import ShopDetail from "@/components/layout/shop/ShopDetail";
import { CartPage } from "@/features/cart/CartPage";
import { DashboardSection } from "@/features/shop/DashboardSection";
import { ShopDirectory } from "@/features/pages/public/ShopDirectory";

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. PUBLIC & AUTH ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgetPassword />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing" element={<Pricing/>}/>
      <Route path="/shops" element={<ShopDirectory />} />

      {/* 2. SHARED PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route path="/role-redirect" element={<RoleRedirect />} />
        <Route path="/account/settings" element={<SettingsPage />} />
        <Route path="/create-shop" element={<CreateShopPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Route>

      {/* 3. SHOP OWNER ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["SHOP_OWNER"]} />}>
      
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="orders" element={<DashboardSection section="orders" />} />
          <Route path="products" element={<DashboardSection section="products" />} />
          <Route path="settings" element={<DashboardSection section="settings" />} />
          <Route path="analytics" element={<DashboardSection section="analytics" />} />
          <Route path="customers" element={<DashboardSection section="customers" />} />
           <Route path="shops">
    <Route index element={<Shops />} />
    <Route path=":id/detail" element={<ShopDetail />} />
  </Route>
          
         
        </Route>
      </Route>

      {/* 4. EMPLOYEE ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["SHOP_EMPLOYEE"]} />}>
        <Route path="/employee" element={<DashboardSection section="orders" />} />
      </Route>

      {/* 5. SUPER ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/superadmin" element={<SuperAdminHome />} />
        </Route>
      </Route>
    </Routes>
  );
}