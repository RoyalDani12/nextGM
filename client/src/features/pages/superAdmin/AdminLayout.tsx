import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { SuperAdminHeader } from "./SuperAdminHeader";

export const AdminLayout = () => (
    <div className="admin-dashboard flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased">
        {/* Desktop Sidebar: docked to the left, full height from the very top */}
        <div className="hidden h-full shrink-0 border-r border-slate-800 bg-[#0F172A] lg:flex">
            <AdminSidebar />
        </div>

        {/* Right Content Area: Header at top + scrollable Main content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <SuperAdminHeader />
            <main className="min-w-0 flex-1 overflow-y-auto ds-scroll bg-slate-50/70">
                <div className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    </div>
);
