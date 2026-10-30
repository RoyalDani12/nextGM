import React from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

// ── Page Wrapper ──────────────────────────────────────────
export const PageEnter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`ds-page-enter ${className}`}>{children}</div>
);

// ── Page Header ───────────────────────────────────────────
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, className = "" }) => (
  <div className={`flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-8 ${className}`}>
    <div className="ds-page-header mb-0">
      <h1 className="ds-page-title">{title}</h1>
      {subtitle && <p className="ds-page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">{actions}</div>}
  </div>
);

// ── Section Label ─────────────────────────────────────────
export const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <p className={`ds-section-label ${className}`}>{children}</p>
);

// ── KPI Stat Card ─────────────────────────────────────────
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg?: string;
  sub?: string;
  trend?: { value: number; label?: string };
  onClick?: () => void;
}
export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon: Icon, iconBg = "bg-slate-700", sub, trend, onClick,
}) => (
  <div className={`ds-stat-card ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
    <div className="flex items-center justify-between">
      <p className="ds-stat-label">{title}</p>
      <div className={`ds-stat-icon-wrapper ${iconBg}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="ds-stat-value">{value}</p>
    {(sub || trend) && (
      <div className="flex items-center justify-between gap-2">
        {sub && <p className="ds-stat-sub">{sub}</p>}
        {trend && (
          <span className={`text-[11px] font-semibold ${trend.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label ?? ""}
          </span>
        )}
      </div>
    )}
  </div>
);

// ── Empty State ───────────────────────────────────────────
export const EmptyState: React.FC<{
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
    {Icon && (
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icon size={24} className="text-slate-400" />
      </div>
    )}
    <div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ── Loading Spinner ───────────────────────────────────────
export const LoadingState: React.FC<{ label?: string; size?: number }> = ({
  label = "Loading...", size = 28,
}) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="relative">
      <Loader2 size={size} className="animate-spin text-orange-400" />
      <div className="absolute inset-0 rounded-full" style={{background: 'radial-gradient(circle, rgb(249 115 22 / 0.12), transparent 70%)'}} />
    </div>
    <p className="text-xs font-medium text-slate-400">{label}</p>
  </div>
);

// ── DS Badge ──────────────────────────────────────────────
type BadgeVariant = "orange" | "green" | "red" | "yellow" | "blue" | "purple" | "slate";
export const DSBadge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}> = ({ children, variant = "slate", dot = false, className = "" }) => (
  <span className={`ds-badge-${variant} ${dot ? "ds-badge-dot" : ""} ${className}`}>
    {children}
  </span>
);

// ── DS Card ───────────────────────────────────────────────
export const DSCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  glass?: boolean;
  onClick?: () => void;
}> = ({ children, className = "", elevated, interactive, glass, onClick }) => {
  const base = glass ? "ds-card-glass" : elevated ? "ds-card-elevated" : interactive ? "ds-card-interactive" : "ds-card";
  return <div className={`${base} ${className}`} onClick={onClick}>{children}</div>;
};

// ── Progress Bar ──────────────────────────────────────────
export const DSProgress: React.FC<{ value: number; max?: number; className?: string }> = ({
  value, max = 100, className = "",
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`ds-progress-track ${className}`}>
      <div className="ds-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

// ── Skeleton Blocks ───────────────────────────────────────
export const DSSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`ds-skeleton ${className}`} />
);

export const DSSkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="ds-card p-5 space-y-3">
    <DSSkeleton className="h-5 w-1/3" />
    {Array.from({ length: lines }).map((_, i) => (
      <DSSkeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
    ))}
  </div>
);

// ── Modal Portal ──────────────────────────────────────────
export const ModalPortal: React.FC<{
  children: React.ReactNode;
  onClose?: () => void;
}> = ({ children, onClose }) => {
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};
