import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { SuperAdminHeader } from "./SuperAdminHeader";

export const AdminLayout = () => {
    return (
        <div className="flex min-h-screen w-full bg-gray-50">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Main Content Pane */}
            <div className="flex flex-col flex-1 min-w-0">
                <SuperAdminHeader />
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};