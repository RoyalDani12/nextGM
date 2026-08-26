import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardNavbar } from "./DashboardNavbar";

export function DashboardLayout() {
    return (
        // h-screen + overflow-hidden locks the shell to the viewport height —
        // this is what stops the whole page (navbar + sidebar included) from
        // scrolling away. Only <main> below scrolls internally.
        <div className="h-screen overflow-hidden bg-slate-50 font-sans antialiased">
            <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col">
                <DashboardNavbar />

                <div className="flex flex-1 min-h-0 px-3 pb-3 md:px-5 md:pb-5">
                    <div className="flex flex-1 min-h-0 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">

                        {/* Sidebar owns its own width (rail w-16 / open w-64) and manages
                            its hover-flyout internally. Hidden below lg — mobile nav
                            lives in the Sheet in the navbar. */}
                        <div className="hidden lg:flex border-r border-slate-200">
                            <DashboardSidebar variant="desktop" />
                        </div>

                        <main className="min-w-0 flex-1 overflow-y-auto bg-white">
                            <div className="p-5 md:p-7 lg:p-10">
                                <Outlet />
                            </div>
                        </main>

                    </div>
                </div>
            </div>
        </div>
    );
}