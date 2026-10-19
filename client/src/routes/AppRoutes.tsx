import { Routes, Route } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
// import { LoginPage } from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import VerifyEmailNotice from "../features/auth/VerifyEmailNotice";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage";
import { DashboardHome } from "@/features/shop/DashboardHome";
import ProtectedRoute from "./ProtectedRoute";
// import { Home } from "@/features/pages/public/Home";
import { Home } from "@/features/marketplace/pages/Home";
import { DashboardLayout } from "@/features/shop/DashboardLayout";
import SettingsPage from "../features/users/SettingsPage";
import { ForgetPassword } from "@/features/auth/ForgetPassword";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import RoleRedirect from "./RoleRedirect";
import { SuperAdminHome } from "@/features/pages/superAdmin/SuperAdminHome";
import { AdminLayout } from "@/features/pages/superAdmin/AdminLayout";
import { AdminUsersPage } from "@/features/pages/superAdmin/AdminUsersPage";
import { AdminUserDetailPage } from "@/features/pages/superAdmin/AdminUserDetailPage";
import { AdminShopsPage } from "@/features/pages/superAdmin/AdminShopsPage";
import { AdminShopDetailPage } from "@/features/pages/superAdmin/AdminShopDetailPage";
// import  { createShopPage } from "@features/shop/CreateShopPage"
import { CreateShopPage } from "@/features/shop/CreateShopPage";
import ProductPage from "@/features/product/ProductPage";
import ProductDetailPage from "@/features/product/ProductDetailPage";
import { CartPage } from "@/features/cart/CartPage";
import { CheckoutPage } from "@/features/order/CheckoutPage";
import PaymentPage from "@/features/payment/PaymentPage";
import { OrderConfirmationPage } from "@/features/order/OrderConfirmationPage";
import CustomerOrderDetailPage from "@/features/customer/CustomerOrderDetailPage";
import { ShopOrdersPage } from "@/features/shop/ShopOrdersPage";
import { ShopReviewsPage } from "@/features/shop/ShopReviewsPage";
const DashboardSettings = () => <div className="p-6 font-semibold">Settings Page</div>;
const DashboardAnalytics = () => <div className="p-6 font-semibold">Analitics Page</div>;
import { PayoutDashboard as DashboardPayouts } from "@/features/shop/payouts/PayoutDashboard";
const DashboardDiscounts = () => <div className="p-6 font-semibold">discount Page</div>;
import OrdersPage from "@/features/customer/CustomerOrder";
import ShopSelectionPage from "@/features/shop/ShopSelectionPage";
// import ShopOrderDetailPage from "@/components/layout/shop/ShopOrderDetailPage";
import ShopOrderDetailPage from "@/features/shop/components/ShopOrderDetailPage";
import { AdminCategoriesPage } from "@/features/pages/superAdmin/AdminCategoriesPage";
import { AdminReviewsPage } from "@/features/pages/superAdmin/AdminReviewsPage";
import WishlistPage from "@/features/customer/WishlistPage";
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

         <Route path="/wishlist" element={<WishlistPage />} />
         <Route path="/cart" element={<CartPage />} />

         {/* 2. SHARED PROTECTED ROUTES */}
         <Route element={<ProtectedRoute />}>
            <Route path="/role-redirect" element={<RoleRedirect />} />
            <Route path="/account/settings" element={<SettingsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment/:checkoutId" element={<PaymentPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/customer-order" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<CustomerOrderDetailPage />} />
            <Route path="/shops" element={<ShopSelectionPage />} />
            <Route path="/shops/new" element={<CreateShopPage />} />
         </Route>

         {/* 3. SHOP OWNER ROUTES */}
         <Route element={<ProtectedRoute allowedRoles={["SHOP_OWNER"]} />}>
            <Route path="/dashboard/shop/:shopId" element={<DashboardLayout />}>
               <Route index element={<DashboardHome />} />
               <Route path="products" element={<ProductPage />} />
               <Route path="products/:productId" element={<ProductDetailPage />} />
               <Route path="orders/:orderId" element={<ShopOrderDetailPage />} />
               <Route path="orders" element={<ShopOrdersPage />} />
               <Route path="reviews" element={<ShopReviewsPage />} />
               <Route path="analytics" element={<DashboardAnalytics />} />
               <Route path="discounts" element={<DashboardDiscounts />} />
               <Route path="payouts" element={<DashboardPayouts />} />
               <Route path="settings" element={<DashboardSettings />} />
            </Route>
         </Route>

         {/* 4. EMPLOYEE ROUTES */}
         <Route element={<ProtectedRoute allowedRoles={["SHOP_EMPLOYEE"]} />}>
            <Route path="/employee" element={<div className="p-6">Employee Dashboard</div>} />
         </Route>

         {/* 5. SUPER ADMIN ROUTES */}
         <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route element={<AdminLayout />}>
               <Route path="/superadmin" element={<SuperAdminHome />} />
               <Route path="/superadmin/users" element={<AdminUsersPage />} />
               <Route path="/superadmin/users/:id" element={<AdminUserDetailPage />} />
               <Route path="/superadmin/shops" element={<AdminShopsPage />} />
               <Route path="/superadmin/shops/:id" element={<AdminShopDetailPage />} />
               <Route path="/superadmin/categories" element={<AdminCategoriesPage />} />
               <Route path="/superadmin/reviews" element={<AdminReviewsPage />} />
            </Route>
         </Route>
         <Route path="*" element={<div className="flex min-h-screen items-center justify-center p-6 text-center"><div><h1 className="text-2xl font-bold">Page not found</h1><p className="mt-2 text-gray-600">The page you requested does not exist.</p></div></div>} />
      </Routes>
   );
}
