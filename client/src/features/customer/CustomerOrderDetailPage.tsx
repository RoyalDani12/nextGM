import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomerOrderByIdRequest } from "../order/order.api";
import { ArrowLeft, Package, Store, Clock, CreditCard, MapPin, AlertCircle, Calendar } from "lucide-react";

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["customer-order", orderId],
    queryFn: () => getCustomerOrderByIdRequest(orderId!),
    enabled: !!orderId,
  });

  // Extract order object matching your exact API response structure
  const order = response?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertCircle className="size-10 text-rose-500 mb-2" />
        <p className="text-sm font-medium text-slate-800">Order not found or failed to load.</p>
        <button
          type="button"
          onClick={() => navigate("/customer-order")}
          className="mt-4 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 cursor-pointer"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const shopProfile = order.shop?.profile;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Back Button & Header */}
        <button
          type="button"
          onClick={() => navigate("/customer-order")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Back to Orders
        </button>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold w-fit ${
            order.status === "CONFIRMED" || order.status === "COMPLETED" || order.status === "DELIVERED"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : order.status === "REFUNDED"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            <Clock className="size-3.5" /> {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Column: Items & Timeline */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Order Items</h2>
              
              <div className="divide-y divide-slate-100">
                {order.items?.map((item: any) => {
                  const product = item.product;
                  const itemImage = product?.images?.[0];

                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {itemImage ? (
                          <img src={itemImage} alt={product?.name} className="size-14 rounded-xl object-cover border border-slate-100 shrink-0" />
                        ) : (
                          <div className="flex size-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shrink-0">
                            <Package className="size-6" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{product?.name || "Product Item"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-slate-900">
                        ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status History Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Order Timeline</h2>
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-100">
                  {order.statusHistory.map((history: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 relative">
                      <div className="size-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold z-10 shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">{history.status}</p>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="size-3" /> {new Date(history.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {history.note && <p className="text-xs text-slate-600 mt-0.5">{history.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column: Shop, Shipping & Summary */}
          <div className="space-y-6">
            {/* Shop Information */}
            {order.shop && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Store Information</h3>
                <div className="flex items-center gap-3">
                  {shopProfile?.logo ? (
                    <img src={shopProfile.logo} alt={shopProfile.name} className="size-12 rounded-xl object-cover border border-slate-100" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Store className="size-6" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{shopProfile?.name || order.shop.slug}</p>
                    <p className="text-xs text-slate-500">@{order.shop.slug}</p>
                    {shopProfile?.phone && <p className="text-[11px] text-slate-400 mt-0.5">{shopProfile.phone}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> Shipping Address
                </h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode} ({order.shippingAddress.country})</p>
                  <p className="text-slate-500 pt-1">Phone: {order.shippingAddress.phone}</p>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Payment Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${Number(order.totalAmount).toFixed(2)}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-${Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span>${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {order.payment ? (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <CreditCard className="size-4" /> Payment Status: {order.payment.status}
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-600 font-medium">
                  <CreditCard className="size-4" /> Payment: Pending / Not recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}