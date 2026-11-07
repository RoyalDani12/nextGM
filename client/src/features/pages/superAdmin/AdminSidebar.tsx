import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PanelLeft, X } from "lucide-react";
import { AdminNavLinks } from "./AdminNavLinks";

const PIN_STORAGE_KEY = "admin-sidebar-pinned";

interface AdminSidebarProps {
    variant?: "desktop" | "mobile";
    onNavItemClick?: () => void;
}

export const AdminSidebar = ({
    variant = "desktop",
    onNavItemClick,
}: AdminSidebarProps) => {
    const isMobile = variant === "mobile";

    const [pinned, setPinned] = useState<boolean>(() => {
        if (isMobile || typeof window === "undefined") return true;
        const stored = window.localStorage.getItem(PIN_STORAGE_KEY);
        return stored === null ? true : stored === "true";
    });

    const [peeking, setPeeking] = useState(false);

    useEffect(() => {
        if (!isMobile) {
            window.localStorage.setItem(PIN_STORAGE_KEY, String(pinned));
        }
    }, [isMobile, pinned]);

    const collapsed = !isMobile && !pinned;
    const expanded = isMobile || pinned || peeking;

    return (
        <div
            onMouseEnter={() => collapsed && setPeeking(true)}
            onMouseLeave={() => setPeeking(false)}
            className={`relative h-full shrink-0 transition-[width] duration-200 ease-out ${
                isMobile ? "w-full" : collapsed ? "w-16" : "w-64"
            }`}
        >
            <aside
                className={`flex h-full flex-col select-none bg-[#533257] text-slate-100 transition-all duration-200 ease-out ${
                    isMobile
                        ? "w-full border-r-0"
                        : `${expanded ? "w-64" : "w-full"} border-r border-slate-800`
                } ${
                    peeking
                        ? "absolute left-0 top-0 z-50 rounded-r-3xl border-r border-slate-800 bg-[#533257] shadow-2xl shadow-black/80"
                        : ""
                }`}
            >
                {/* BRAND HEADER */}
                <div
                    className={`flex h-16 shrink-0 items-center border-b border-white/10 px-4 ${
                        expanded ? "justify-between" : "justify-center"
                    }`}
                >
                    <Link
                        to="/superadmin"
                        onClick={onNavItemClick}
                        className="flex items-center gap-2.5 overflow-hidden group min-w-0"
                    >
                        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-700/60 shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-200">
                            <img
                                src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png"
                                alt="Nexions"
                                className="size-6 object-contain"
                            />
                        </div>

                        {expanded && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-black tracking-tight text-white flex items-center gap-1.5">
                                    Nexions
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        Admin
                                    </span>
                                </span>

                                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                    Control Center
                                </span>
                            </div>
                        )}
                    </Link>

                    {isMobile ? (
                        <button
                            type="button"
                            onClick={onNavItemClick}
                            className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            title="Close navigation"
                            aria-label="Close navigation"
                        >
                            <X className="size-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setPinned((value) => !value)}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
                            title={pinned ? "Collapse sidebar" : "Pin sidebar"}
                        >
                            <PanelLeft className="size-4" />
                        </button>
                    )}
                </div>

                {/* NAVIGATION */}
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3.5 ds-scroll">
                    <AdminNavLinks
                        expanded={expanded}
                        onNavItemClick={onNavItemClick}
                    />
                </div>

                {/* FOOTER */}
                {expanded && (
                    <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        <span className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            Platform Live
                        </span>
                        <span className="font-mono text-[9px] text-slate-400">v2.4</span>
                    </div>
                )}
            </aside>
        </div>
    );
};
