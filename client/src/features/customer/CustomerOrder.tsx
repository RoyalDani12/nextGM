import { ClipboardList, Package, ChevronRight, Clock, CheckCircle2, ShoppingBag, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import { useCustomerOrders } from "@/features/order/useOrders";
import { useCustomerOrder } from "./customerOrder.hook";
import { useEffect, useState } from "react";

export default function OrdersPage() {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useCustomerOrder();
  const [showToast, setShowToast] = useState(false);

  const orders = response?.data?.orders || [];

  // Handle auto-dismissing toast after data successfully loads
  useEffect(() => {
    if (response && !isLoading) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000); // Disappears after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [response, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <p className="text-sm font-medium text-slate-800">Failed to load your orders.</p>
        <p className="text-xs text-slate-500 mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Centered, Wide, Green Animated Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-600 px-5 py-4 shadow-xl text-white">
            <CheckCircle2 className="size-6 shrink-0 text-white" />
            <div>
              <p className="text-sm font-bold">Success</p>
              <p className="text-xs text-emerald-100">Your orders were fetched successfully.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-6 text-slate-700" />
            <h1 className="text-2xl font-semibold text-slate-900">Your Orders</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">View and manage your recent orders.</p>
        </div>

        {/* Orders List / Empty State */}
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Package className="mx-auto size-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">No orders found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                You haven't placed any orders yet. Explore our products and start shopping!
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-slate-800 cursor-pointer"
              >
                <ShoppingBag className="size-4" />
                Shop Now
              </button>
            </div>
          ) : (
            orders.map((order: any) => (
              <div
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100">
                      <Package className="size-5 text-slate-500" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </p>
                        {order.shop?.name && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <Store className="size-3" /> {order.shop.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()} · {order.itemCount}{" "}
                        {order.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                      order.status === "CONFIRMED" || order.status === "COMPLETED" || order.status === "DELIVERED"
                        ? "text-green-600"
                        : order.status === "REFUNDED"
                        ? "text-blue-600"
                        : "text-amber-600"
                    }`}>
                      <Clock className="size-3.5 inline" /> {order.status}
                    </span>
                  </div>
                </div>

                {/* View order button */}
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  View order details
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}