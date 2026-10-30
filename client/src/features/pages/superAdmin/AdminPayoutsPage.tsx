import { useState } from "react";
import { Loader2, Wallet, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { useAdminPayouts, usePayoutsSummary } from "@/features/admin/admin.hooks";

const ShopStatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        ACTIVE: "bg-emerald-100 text-emerald-700",
        PENDING: "bg-yellow-100 text-yellow-700",
        PAUSED: "bg-blue-100 text-blue-700",
        SUSPENDED: "bg-red-100 text-red-700",
        CLOSED: "bg-gray-100 text-gray-500",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? "bg-gray-100"}`}>
            {status}
        </span>
    );
};

const SummaryCard = ({
    label,
    value,
    sub,
    accent = "orange",
}: {
    label: string;
    value: string;
    sub?: string;
    accent?: string;
}) => {
    const accents: Record<string, string> = {
        orange: "text-orange-600",
        emerald: "text-emerald-600",
        blue: "text-blue-600",
        violet: "text-violet-600",
    };
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${accents[accent] ?? "text-gray-900"}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
};

export const AdminPayoutsPage = () => {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useAdminPayouts({ page, limit: 20 });
    const { data: summary, isLoading: summaryLoading } = usePayoutsSummary();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Wallet className="size-6 text-orange-600" />
                    Payout Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Read-only oversight of shop wallet balances. Actual payouts are handled by sellers via Stripe.
                </p>
            </div>

            {/* Summary Cards */}
            {summaryLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="animate-spin" size={16} />
                    Loading summary...
                </div>
            ) : summary ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard
                        label="Total Platform Balance"
                        value={`$${summary.totalPlatformBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        sub="Across all shop wallets"
                        accent="orange"
                    />
                    <SummaryCard
                        label="Shops with Balance"
                        value={summary.shopsWithBalance.toLocaleString()}
                        sub="Shops with balance > $0"
                        accent="emerald"
                    />
                    <SummaryCard
                        label="Total Withdrawn"
                        value={`$${summary.totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        sub="All-time debit transactions"
                        accent="violet"
                    />
                </div>
            ) : null}

            {/* Notice */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">ℹ</span>
                <span>
                    This is a <strong>read-only overview</strong>. Sellers withdraw funds directly through their Stripe connected accounts.
                    Balances reflect available funds in shop wallets pending seller withdrawal.
                </span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="animate-spin text-gray-400" size={28} />
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-48 text-red-500 text-sm">Failed to load payouts data.</div>
                ) : !data?.shops.length ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Building2 size={32} className="mb-2 opacity-40" />
                        <p className="text-sm">No shops found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet Balance</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Withdrawal</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.shops.map((shop) => {
                                    const lastTx = shop.walletTransactions[0];
                                    const balance = Number(shop.wallet?.balance ?? 0);
                                    return (
                                        <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {shop.profile?.logo ? (
                                                        <img src={shop.profile.logo} alt="" className="size-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="size-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                            <Building2 size={14} className="text-orange-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{shop.profile?.name ?? shop.slug}</p>
                                                        <p className="text-xs text-gray-400">/{shop.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-900">{shop.owner.name}</p>
                                                <p className="text-xs text-gray-400">{shop.owner.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <ShopStatusBadge status={shop.status} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${balance > 0 ? "text-orange-600" : "text-gray-400"}`}>
                                                    ${balance.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {lastTx ? new Date(lastTx.createdAt).toLocaleDateString() : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                                {lastTx ? `-$${Number(lastTx.amount).toFixed(2)}` : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Page {data.page} of {data.totalPages} · {data.total} shops
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={14} />
                                Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPayoutsPage;
