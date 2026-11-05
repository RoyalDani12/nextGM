import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRedirect from "./RoleRedirect";

// ─── Lazy Imports ──────────────────────────────────────────────────────────────

// Auth
const LoginPage              = lazy(() => import("../features/auth/LoginPage"));
const RegisterPage           = lazy(() => import("../features/auth/RegisterPage"));
const VerifyEmailNotice      = lazy(() => import("../features/auth/VerifyEmailNotice"));
const VerifyEmailPage        = lazy(() => import("@/features/auth/VerifyEmailPage"));
const ForgetPassword         = lazy(() => import("@/features/auth/ForgetPassword").then(m => ({ default: m.ForgetPassword })));
const ResetPasswordPage      = lazy(() => import("@/features/auth/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const AuthCallbackPage       = lazy(() => import("@/features/auth/AuthCallbackPage"));

// Marketplace / Public
const Home                   = lazy(() => import("@/features/marketplace/pages/Home").then(m => ({ default: m.Home })));
const StorefrontPage         = lazy(() => import("@/features/marketplace/pages/StorefrontPage").then(m => ({ default: m.StorefrontPage })));
const AboutPage              = lazy(() => import("@/features/marketplace/pages/AboutPage"));
const ContactSupportPage     = lazy(() => import("@/features/marketplace/pages/ContactSupportPage"));
const HelpCenterPage         = lazy(() => import("@/features/marketplace/pages/HelpCenterPage"));
const HowItWorksPage         = lazy(() => import("@/features/marketplace/pages/HowItWorksPage"));

// Customer
const WishlistPage           = lazy(() => import("@/features/customer/WishlistPage"));
const CartPage               = lazy(() => import("@/features/cart/CartPage").then(m => ({ default: m.CartPage })));
const CheckoutPage           = lazy(() => import("@/features/order/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const PaymentPage            = lazy(() => import("@/features/payment/PaymentPage"));
const OrderConfirmationPage  = lazy(() => import("@/features/order/OrderConfirmationPage").then(m => ({ default: m.OrderConfirmationPage })));
const OrdersPage             = lazy(() => import("@/features/customer/CustomerOrder"));
const CustomerOrderDetailPage = lazy(() => import("@/features/customer/CustomerOrderDetailPage"));
const CustomerReturnsPage    = lazy(() => import("@/features/returns/CustomerReturnsPage"));

// Shared protected
const SettingsPage           = lazy(() => import("../features/users/SettingsPage"));
const ShopSelectionPage      = lazy(() => import("@/features/shop/ShopSelectionPage"));
const CreateShopPage         = lazy(() => import("@/features/shop/CreateShopPage").then(m => ({ default: m.CreateShopPage })));

// Shop Owner Dashboard
const DashboardLayout        = lazy(() => import("@/features/shop/DashboardLayout").then(m => ({ default: m.DashboardLayout })));
const DashboardHome          = lazy(() => import("@/features/shop/DashboardHome").then(m => ({ default: m.DashboardHome })));
const ProductPage            = lazy(() => import("@/features/product/ProductPage"));
const ProductDetailPage      = lazy(() => import("@/features/product/ProductDetailPage"));
const ShopOrderDetailPage    = lazy(() => import("@/features/shop/components/ShopOrderDetailPage"));
const ShopOrdersPage         = lazy(() => import("@/features/shop/ShopOrdersPage").then(m => ({ default: m.ShopOrdersPage })));
const ShopReturnsPage        = lazy(() => import("@/features/returns/ShopReturnsPage"));
const ShopReturnDetailPage   = lazy(() => import("@/features/returns/ShopReturnDetailPage"));
const ShopReviewsPage        = lazy(() => import("@/features/shop/ShopReviewsPage").then(m => ({ default: m.ShopReviewsPage })));
const AnalyticsPage          = lazy(() => import("@/features/shop/analytics/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const CouponsPage            = lazy(() => import("@/features/shop/CouponsPage"));
const DashboardPayouts       = lazy(() => import("@/features/shop/payouts/PayoutDashboard").then(m => ({ default: m.PayoutDashboard })));
const DashboardSettings      = lazy(() => import("@/features/shop/ShopSettingsPage").then(m => ({ default: m.ShopSettingsPage })));

// Super Admin
const AdminLayout            = lazy(() => import("@/features/pages/superAdmin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const SuperAdminHome         = lazy(() => import("@/features/pages/superAdmin/SuperAdminHome").then(m => ({ default: m.SuperAdminHome })));
const AdminAnalyticsPage     = lazy(() => import("@/features/pages/superAdmin/AdminAnalyticsPage").then(m => ({ default: m.AdminAnalyticsPage })));
const AdminOrdersPage        = lazy(() => import("@/features/pages/superAdmin/AdminOrdersPage").then(m => ({ default: m.AdminOrdersPage })));
const AdminProductsPage      = lazy(() => import("@/features/pages/superAdmin/AdminProductsPage").then(m => ({ default: m.AdminProductsPage })));
const AdminUsersPage         = lazy(() => import("@/features/pages/superAdmin/AdminUsersPage").then(m => ({ default: m.AdminUsersPage })));
const AdminUserDetailPage    = lazy(() => import("@/features/pages/superAdmin/AdminUserDetailPage").then(m => ({ default: m.AdminUserDetailPage })));
const AdminShopsPage         = lazy(() => import("@/features/pages/superAdmin/AdminShopsPage").then(m => ({ default: m.AdminShopsPage })));
const AdminShopDetailPage    = lazy(() => import("@/features/pages/superAdmin/AdminShopDetailPage").then(m => ({ default: m.AdminShopDetailPage })));
const AdminCategoriesPage    = lazy(() => import("@/features/pages/superAdmin/AdminCategoriesPage").then(m => ({ default: m.AdminCategoriesPage })));
const AdminCouponsPage       = lazy(() => import("@/features/pages/superAdmin/AdminCouponsPage").then(m => ({ default: m.AdminCouponsPage })));
const AdminReviewsPage       = lazy(() => import("@/features/pages/superAdmin/AdminReviewsPage").then(m => ({ default: m.AdminReviewsPage })));
const AdminShipmentsPage     = lazy(() => import("@/features/pages/superAdmin/AdminShipmentsPage").then(m => ({ default: m.AdminShipmentsPage })));
const AdminReturnsPage       = lazy(() => import("@/features/pages/superAdmin/AdminReturnsPage").then(m => ({ default: m.AdminReturnsPage })));
const AdminPayoutsPage       = lazy(() => import("@/features/pages/superAdmin/AdminPayoutsPage").then(m => ({ default: m.AdminPayoutsPage })));
const AdminBillingPage       = lazy(() => import("@/features/pages/superAdmin/AdminBillingPage").then(m => ({ default: m.AdminBillingPage })));
const AdminAuditsPage        = lazy(() => import("@/features/pages/superAdmin/AdminAuditsPage").then(m => ({ default: m.AdminAuditsPage })));
const AdminSupportPage       = lazy(() => import("@/features/pages/superAdmin/AdminSupportPage").then(m => ({ default: m.AdminSupportPage })));

// ─── Suspense Fallback ─────────────────────────────────────────────────────────

function PageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
                <p className="text-xs font-semibold text-slate-400 tracking-wide">Loading…</p>
            </div>
        </div>
    );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* 1. PUBLIC & AUTH ROUTES */}
                <Route path="/" element={<Home />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactSupportPage />} />
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgetPassword />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/:shopSlug" element={<StorefrontPage />} />

                {/* 2. SHARED PROTECTED ROUTES */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/role-redirect" element={<RoleRedirect />} />
                    <Route path="/account/settings" element={<SettingsPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/payment/:checkoutId" element={<PaymentPage />} />
                    <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                    <Route path="/customer-order" element={<OrdersPage />} />
                    <Route path="/orders/:orderId" element={<CustomerOrderDetailPage />} />
                    <Route path="/returns" element={<CustomerReturnsPage />} />
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
                        <Route path="returns" element={<ShopReturnsPage />} />
                        <Route path="returns/:returnId" element={<ShopReturnDetailPage />} />
                        <Route path="reviews" element={<ShopReviewsPage />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="discounts" element={<CouponsPage />} />
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
                        <Route path="/superadmin/analytics" element={<AdminAnalyticsPage />} />
                        <Route path="/superadmin/orders" element={<AdminOrdersPage />} />
                        <Route path="/superadmin/products" element={<AdminProductsPage />} />
                        <Route path="/superadmin/users" element={<AdminUsersPage />} />
                        <Route path="/superadmin/users/:id" element={<AdminUserDetailPage />} />
                        <Route path="/superadmin/shops" element={<AdminShopsPage />} />
                        <Route path="/superadmin/shops/:id" element={<AdminShopDetailPage />} />
                        <Route path="/superadmin/categories" element={<AdminCategoriesPage />} />
                        <Route path="/superadmin/coupons" element={<AdminCouponsPage />} />
                        <Route path="/superadmin/reviews" element={<AdminReviewsPage />} />
                        <Route path="/superadmin/shipments" element={<AdminShipmentsPage />} />
                        <Route path="/superadmin/returns" element={<AdminReturnsPage />} />
                        <Route path="/superadmin/payouts" element={<AdminPayoutsPage />} />
                        <Route path="/superadmin/billing" element={<AdminBillingPage />} />
                        <Route path="/superadmin/audits" element={<AdminAuditsPage />} />
                        <Route path="/superadmin/support" element={<AdminSupportPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<div className="flex min-h-screen items-center justify-center p-6 text-center"><div><h1 className="text-2xl font-bold">Page not found</h1><p className="mt-2 text-gray-600">The page you requested does not exist.</p></div></div>} />
            </Routes>
        </Suspense>
    );
}
