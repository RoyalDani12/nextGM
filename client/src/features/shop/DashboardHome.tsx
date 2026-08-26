import type { ElementType } from "react";
import { Link } from "react-router-dom";
import {
    Store,
    PackagePlus,
    Wallet,
    CheckCircle2,
    CircleDashed,
    ArrowRight,
    Rocket,
    Clock,
    AlertCircle,
    ShoppingBag,
    TrendingUp,
    Users,
    ChevronRight,
} from "lucide-react";

export type ShopStatus =
    | "PENDING"
    | "UNDER_REVIEW"
    | "ACTIVE"
    | "REJECTED";

export interface SetupStep {
    id: number;
    title: string;
    description: string;
    icon: ElementType;
    isCompleted: boolean;
    link: string;
}

interface DashboardHomeProps {
    shopName?: string;
    shopStatus?: ShopStatus;
    customSteps?: SetupStep[];
    onRequestActivation?: () => void;
}

export function DashboardHome({
    shopName = "Your Shop",
    shopStatus = "PENDING",
    customSteps,
    onRequestActivation,
}: DashboardHomeProps) {
    const defaultSteps: SetupStep[] = [
        {
            id: 1,
            title: "Complete Store Profile",
            description:
                "Add your logo, banner, and business details.",
            icon: Store,
            isCompleted: true,
            link: "/dashboard/shop/profile",
        },
        {
            id: 2,
            title: "Add Your First Product",
            description:
                "Create your first listing with images, pricing, and variants.",
            icon: PackagePlus,
            isCompleted: false,
            link: "/dashboard/products/new",
        },
        {
            id: 3,
            title: "Configure Payouts",
            description:
                "Connect your bank account or wallet to receive payouts.",
            icon: Wallet,
            isCompleted: false,
            link: "/dashboard/settings/payouts",
        },
    ];

    const setupSteps = customSteps ?? defaultSteps;

    const completedCount = setupSteps.filter(
        (step) => step.isCompleted
    ).length;

    const progressPercentage =
        setupSteps.length > 0
            ? Math.round((completedCount / setupSteps.length) * 100)
            : 0;

    const isReadyToPublish =
        setupSteps.length > 0 &&
        completedCount === setupSteps.length;

    const statusConfig: Record<
        ShopStatus,
        {
            icon: ElementType;
            label: string;
            title: string;
            description: string;
            container: string;
            badge: string;
            progress: string;
        }
    > = {
        PENDING: {
            icon: Clock,
            label: "Setup in progress",
            title: `Set up ${shopName}`,
            description:
                "Complete the essential steps below before submitting your shop for activation.",
            container:
                "bg-amber-50/70 border-amber-200",
            badge:
                "bg-amber-100 text-amber-800 border-amber-200",
            progress:
                "bg-amber-500",
        },

        UNDER_REVIEW: {
            icon: Clock,
            label: "Under review",
            title: `${shopName} is under review`,
            description:
                "Your shop has been submitted and is currently being reviewed. We'll let you know when the review is complete.",
            container:
                "bg-blue-50/70 border-blue-200",
            badge:
                "bg-blue-100 text-blue-800 border-blue-200",
            progress:
                "bg-blue-500",
        },

        ACTIVE: {
            icon: CheckCircle2,
            label: "Active",
            title: `${shopName} is live`,
            description:
                "Your shop is active and visible to customers. Manage your products, orders, and store from here.",
            container:
                "bg-emerald-50/70 border-emerald-200",
            badge:
                "bg-emerald-100 text-emerald-800 border-emerald-200",
            progress:
                "bg-emerald-500",
        },

        REJECTED: {
            icon: AlertCircle,
            label: "Action required",
            title: `${shopName} needs attention`,
            description:
                "Your shop could not be activated. Review your shop details, make the required changes, and submit it again.",
            container:
                "bg-rose-50/70 border-rose-200",
            badge:
                "bg-rose-100 text-rose-800 border-rose-200",
            progress:
                "bg-rose-500",
        },
    };

    const currentStatus = statusConfig[shopStatus];
    const StatusIcon = currentStatus.icon;

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">

            {/* -------------------------------------------------
                SHOP HEADER
            ------------------------------------------------- */}
            <section
                className={`rounded-2xl border p-6 md:p-7 ${currentStatus.container}`}
            >
                <div className="flex flex-col gap-5">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
                                <Store className="size-5 text-slate-700" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Current Shop
                                </p>

                                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">
                                    {shopName}
                                </h1>
                            </div>
                        </div>

                        <span
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${currentStatus.badge}`}
                        >
                            <StatusIcon className="size-3.5" />
                            {currentStatus.label}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {currentStatus.title}
                        </h2>

                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                            {currentStatus.description}
                        </p>
                    </div>

                    {/* Setup progress */}
                    {shopStatus !== "ACTIVE" && (
                        <div className="pt-2">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600">
                                    Setup progress
                                </span>

                                <span className="text-xs font-bold text-slate-700">
                                    {completedCount} of {setupSteps.length}
                                </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/80">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${currentStatus.progress}`}
                                    style={{
                                        width: `${progressPercentage}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* -------------------------------------------------
                ACTIVE SHOP STATS
            ------------------------------------------------- */}
            {shopStatus === "ACTIVE" && (
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            Overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            A quick look at your shop performance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                        <StatCard
                            label="Total Sales"
                            value="$0.00"
                            icon={TrendingUp}
                            iconClass="bg-emerald-50 text-emerald-600"
                        />

                        <StatCard
                            label="Orders"
                            value="0"
                            icon={ShoppingBag}
                            iconClass="bg-blue-50 text-blue-600"
                        />

                        <StatCard
                            label="Visitors"
                            value="0"
                            icon={Users}
                            iconClass="bg-purple-50 text-purple-600"
                        />

                    </div>
                </section>
            )}

            {/* -------------------------------------------------
                SETUP / MANAGEMENT
            ------------------------------------------------- */}
            <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {shopStatus === "ACTIVE"
                                ? "Manage Your Shop"
                                : "Shop Setup"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {shopStatus === "ACTIVE"
                                ? "Manage the important parts of your store."
                                : "Complete these steps to get your shop ready."}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {setupSteps.map((step) => {
                        const Icon = step.icon;

                        return (
                            <Link
                                key={step.id}
                                to={step.link}
                                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm"
                            >
                                {/* Step status */}
                                <div className="shrink-0">
                                    {step.isCompleted ? (
                                        <CheckCircle2 className="size-6 text-emerald-500" />
                                    ) : (
                                        <CircleDashed className="size-6 text-amber-500" />
                                    )}
                                </div>

                                {/* Icon */}
                                <div
                                    className={`hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex ${
                                        step.isCompleted
                                            ? "bg-slate-50 text-slate-400"
                                            : "bg-amber-50 text-amber-600"
                                    }`}
                                >
                                    <Icon className="size-5" />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3
                                            className={`text-sm font-bold sm:text-base ${
                                                step.isCompleted
                                                    ? "text-slate-600"
                                                    : "text-slate-900"
                                            }`}
                                        >
                                            {step.title}
                                        </h3>

                                        {step.isCompleted && (
                                            <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:inline-flex">
                                                Complete
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-slate-900 group-hover:text-white">
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* -------------------------------------------------
                ACTIVATION
            ------------------------------------------------- */}
            {shopStatus !== "ACTIVE" && (
                <section className="border-t border-slate-200 pt-6">
                    <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                {shopStatus === "UNDER_REVIEW"
                                    ? "Activation submitted"
                                    : isReadyToPublish
                                      ? "Your shop is ready"
                                      : "Finish your shop setup"}
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {shopStatus === "UNDER_REVIEW"
                                    ? "Your shop is waiting for review."
                                    : isReadyToPublish
                                      ? "Submit your shop for activation."
                                      : "Complete all required steps before requesting activation."}
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={
                                !isReadyToPublish ||
                                shopStatus === "UNDER_REVIEW"
                            }
                            onClick={onRequestActivation}
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all sm:w-auto ${
                                isReadyToPublish &&
                                shopStatus !== "UNDER_REVIEW"
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "cursor-not-allowed border border-slate-200 bg-white text-slate-400"
                            }`}
                        >
                            <Rocket className="size-4" />

                            {shopStatus === "UNDER_REVIEW"
                                ? "Under Review"
                                : "Request Activation"}
                        </button>
                    </div>
                </section>
            )}

            {/* -------------------------------------------------
                ACTIVE SHOP FOOTER
            ------------------------------------------------- */}
            {shopStatus === "ACTIVE" && (
                <div className="flex justify-end border-t border-slate-200 pt-5">
                    <Link
                        to="/dashboard/products"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                    >
                        View Products
                        <ChevronRight className="size-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------
   STAT CARD
------------------------------------------------- */

interface StatCardProps {
    label: string;
    value: string;
    icon: ElementType;
    iconClass: string;
}

function StatCard({
    label,
    value,
    icon: Icon,
    iconClass,
}: StatCardProps) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
                <Icon className="size-5" />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                    {value}
                </p>
            </div>
        </div>
    );
}