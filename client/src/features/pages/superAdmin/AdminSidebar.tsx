import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import { AdminNavLinks } from "./AdminNavLinks";

const PIN_STORAGE_KEY = "superadmin-sidebar-pinned";

interface AdminSidebarProps {
    variant?: "desktop" | "mobile";
    onNavItemClick?: () => void;
}

export const AdminSidebar = ({ variant = "desktop", onNavItemClick }: AdminSidebarProps) => {
    const isMobile = variant === "mobile";
    const [pinned, setPinned] = useState(() => {
        if (isMobile || typeof window === "undefined") return true;
        const stored = window.localStorage.getItem(PIN_STORAGE_KEY);
        return stored === null ? true : stored === "true";
    });
    const [peeking, setPeeking] = useState(false);

    useEffect(() => {
        if (!isMobile) window.localStorage.setItem(PIN_STORAGE_KEY, String(pinned));
    }, [isMobile, pinned]);

    const collapsed = !isMobile && !pinned;
    const expanded = isMobile || pinned || peeking;

    return (
        <div
            onMouseEnter={() => collapsed && setPeeking(true)}
            onMouseLeave={() => setPeeking(false)}
            className={`relative h-full shrink-0 transition-[width] duration-150 ${collapsed ? "w-16" : "w-64"}`}
        >
            <aside className={`flex h-full flex-col select-none bg-white transition-all duration-150 ${expanded ? "w-64" : "w-full"} ${peeking ? "absolute left-0 top-0 z-50 rounded-r-3xl border-r border-slate-200 shadow-2xl shadow-slate-900/10" : ""}`}>
                <div className={`flex h-14 shrink-0 items-center border-b border-slate-100 px-3 ${expanded ? "justify-between" : "justify-center"}`}>
                    <Link to="/superadmin" onClick={onNavItemClick} className="flex items-center gap-2 overflow-hidden">
                        <img src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png" alt="Nexions" className={`${expanded ? "h-7" : "h-6"} w-auto object-contain`} />
                        {expanded && <span className="text-sm font-black tracking-tight text-slate-900">CONTROL CENTER</span>}
                    </Link>
                    {!isMobile && (
                        <button onClick={() => setPinned((value) => !value)} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" title={pinned ? "Collapse sidebar" : "Pin sidebar"}>
                            <PanelLeft className="size-4" />
                        </button>
                    )}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <AdminNavLinks expanded={expanded} onNavItemClick={onNavItemClick} />
                </div>
                {expanded && <div className="border-t border-slate-100 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Platform operations</div>}
            </aside>
        </div>
    );
};
