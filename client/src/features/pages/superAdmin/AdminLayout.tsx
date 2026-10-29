import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { SuperAdminHeader } from "./SuperAdminHeader";

export const AdminLayout = () => (
    <div className="admin-dashboard h-screen overflow-hidden bg-slate-50 font-sans antialiased">
        <div className="mx-auto flex h-full w-full max-w-[1900px] flex-col">
            <SuperAdminHeader />
            <div className="flex min-h-0 flex-1 px-3 pb-3 md:px-5 md:pb-5">
                <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
                    <div className="hidden border-r border-slate-200 lg:flex">
                        <AdminSidebar />
                    </div>
                    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
                        <div className="p-5 md:p-7 lg:p-10"><Outlet /></div>
                    </main>
                </div>
            </div>
        </div>
    </div>
);
