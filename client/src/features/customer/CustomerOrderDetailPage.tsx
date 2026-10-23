import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomerOrderByIdRequest } from "../order/order.api";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  HelpCircle,
  MapPin,
  Package,
  PackageCheck,
  Printer,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

const orderSteps = [
  { key: "PLACED", label: "Order Placed", icon: ShoppingBag, statuses: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
  { key: "CONFIRMED", label: "Confirmed & Prepared", icon: CheckCircle2, statuses: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
  { key: "SHIPPED", label: "Shipped & In Transit", icon: Truck, statuses: ["SHIPPED", "DELIVERED"] },
  { key: "DELIVERED", label: "Delivered", icon: PackageCheck, statuses: ["DELIVERED"] },
];

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-order", orderId],
    queryFn: () => getCustomerOrderByIdRequest(orderId!),
    enabled: !!orderId,
  });

  const order = response?.data;
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    toast.add({
      title: "Order ID copied",
      description: `Copied #${orderId.slice(-8).toUpperCase()} to clipboard`,
      type: "info",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="size-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Retrieving order details...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Order not found</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          We couldn&apos;t find this order. It may have been removed or you may not have access to view it.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => navigate("/customer-order")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const shopProfile = order.shop?.profile;
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  // Calculate current step index for the progress stepper
  let currentStepIdx = 0;
  if (order.status === "DELIVERED" || order.status === "COMPLETED") currentStepIdx = 3;
  else if (order.status === "SHIPPED") currentStepIdx = 2;
  else if (order.status === "CONFIRMED" || order.status === "PROCESSING") currentStepIdx = 1;
  else if (order.status === "PENDING") currentStepIdx = 0;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Header / Breadcrumb Bar */}
      <div className="border-b border-slate-200/80 bg-white shadow-xs">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate("/customer-order")}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                <ArrowLeft className="size-3.5" /> Back to My Orders
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <button
                  type="button"
                  onClick={copyId}
                  title="Copy full Order ID"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono text-slate-600 hover:bg-slate-100 transition"
                >
                  <Copy className="size-3" />
                  <span>{copied ? "Copied!" : "Copy ID"}</span>
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" />
                Placed on {new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* Actions: Print & Status Badge */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                <Printer className="size-3.5" /> Print Receipt
              </button>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold border ${
                  order.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isCancelled
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {order.status === "DELIVERED" ? (
                  <PackageCheck className="size-3.5" />
                ) : isCancelled ? (
                  <XCircle className="size-3.5" />
                ) : (
                  <Clock className="size-3.5" />
                )}
                {order.status.replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        {/* Visual Progress Stepper (Hidden if Cancelled) */}
        {!isCancelled ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Delivery Progress</h2>
            <div className="relative">
              {/* Connector line behind steps */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 right-6 h-0.5 bg-slate-200 -z-0 hidden sm:block" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                {orderSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center">
                      <div
                        className={`size-11 rounded-2xl flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span
                        className={`mt-2.5 text-xs font-bold ${
                          isCompleted ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="mt-0.5 inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Current Status
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-xs flex items-center gap-4 text-rose-900">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <XCircle className="size-6" />
            </div>
            <div>
              <p className="font-bold text-sm">This order has been {order.status.toLowerCase()}</p>
              <p className="text-xs text-rose-700 mt-0.5">
                If payment was captured, your refund is being processed according to our store refund policies.
              </p>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols): Items & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Ordered Items ({order.items?.length ?? 0})
                </h2>
                <span className="text-xs text-slate-400">Sold by {shopProfile?.name || order.shop?.slug}</span>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item: any) => {
                  const product = item.product;
                  // Handle image properly: can be string or object { url: string }
                  const rawImg = product?.images?.[0];
                  const imageUrl = typeof rawImg === "string" ? rawImg : rawImg?.url;

                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Image */}
                        <div className="size-16 shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50 overflow-hidden flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product?.name || "Product"}
                              className="size-full object-cover transition-transform hover:scale-105"
                            />
                          ) : (
                            <Package className="size-6 text-slate-400" />
                          )}
                        </div>

                        {/* Title & Qty */}
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">
                            {product?.name || "Product Item"}
                          </p>
                          {item.variant?.name && (
                            <p className="text-xs text-slate-500 mt-0.5">Variant: {item.variant.name}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            Qty: <span className="font-semibold text-slate-700">{item.quantity}</span> · $
                            {Number(item.unitPrice).toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-slate-900">
                          ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status History / Timeline Card */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-5">Order Tracking History</h2>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {order.statusHistory.map((history: any, index: number) => (
                    <div key={index} className="relative">
                      {/* Step Indicator Dot */}
                      <div className="absolute -left-6 top-0.5 size-5 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                            {history.status.replaceAll("_", " ")}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(history.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {history.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column (1 Col): Merchant, Shipping & Payment Summary */}
          <div className="space-y-6">
            {/* Merchant / Shop Card */}
            {order.shop && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Merchant</h3>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                    {shopProfile?.logo ? (
                      <img src={shopProfile.logo} alt={shopProfile.name} className="size-full object-cover" />
                    ) : (
                      <Store className="size-6 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {shopProfile?.name || order.shop.slug}
                    </p>
                    <p className="text-xs text-slate-500">@{order.shop.slug}</p>
                    {shopProfile?.phone && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{shopProfile.phone}</p>
                    )}
                  </div>
                </div>

                <Link
                  to="/"
                  className="mt-4 block w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Visit Storefront
                </Link>
              </div>
            )}

            {/* Shipping Destination */}
            {order.shippingAddress && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-orange-500" /> Shipping Destination
                </h3>
                <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-sm text-slate-900">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode || ""}{" "}
                    ({order.shippingAddress.country})
                  </p>
                  <p className="text-slate-500 pt-1">Phone: {order.shippingAddress.phone}</p>
                </div>
              </div>
            )}

            {order.shipment && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><Truck className="size-3.5 text-orange-500" /> Delivery & tracking</h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between"><span className="font-semibold text-slate-900">{order.shipment.method.replace("_", " ")} delivery</span><span>{Number(order.shipment.fee) === 0 ? "Free" : `$${Number(order.shipment.fee).toFixed(2)}`}</span></div>
                  {order.shipment.estimatedDeliveryEnd && <p>Estimated by <span className="font-semibold text-slate-800">{new Date(order.shipment.estimatedDeliveryEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></p>}
                  {order.shipment.shippedAt && <p className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">{order.shipment.method === "PICKUP" ? "Ready for pickup" : "Handed to carrier"} {new Date(order.shipment.shippedAt).toLocaleDateString()}</p>}
                  {order.shipment.carrier && <p>Carrier / pickup: <span className="font-semibold text-slate-800">{order.shipment.carrier}</span></p>}
                  {order.shipment.trackingNumber && <p>Tracking number: <span className="font-mono font-semibold text-slate-800">{order.shipment.trackingNumber}</span></p>}
                  {order.shipment.trackingUrl && <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-700">Track with carrier <ExternalLink className="size-3" /></a>}
                  {order.shipment.note && <p className="border-t border-slate-100 pt-2 text-slate-500">{order.shipment.note}</p>}
                  {order.shipment.deliveredAt && <p className="rounded-xl bg-emerald-50 p-2.5 font-semibold text-emerald-800">Delivered {new Date(order.shipment.deliveredAt).toLocaleDateString()}</p>}
                </div>
              </div>
            )}

            {/* Financial & Payment Summary */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-orange-500" /> Payment Summary
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-900">${(Number(order.totalAmount) + Number(order.discountAmount || 0) - Number(order.shipment?.fee || 0)).toFixed(2)}</span>
                </div>

                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="size-3" />
                      Coupon Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}
                    </span>
                    <span>-${Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-emerald-600">{Number(order.shipment?.fee || 0) === 0 ? "FREE" : `$${Number(order.shipment.fee).toFixed(2)}`}</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-900">Total Paid</span>
                  <span className="font-extrabold text-lg text-slate-900">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Badge */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                {order.payment ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      {order.payment.provider || "Card"}
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-[11px] text-emerald-700">
                      {order.payment.status}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <CreditCard className="size-4 text-amber-500" />
                      Payment
                    </span>
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-[11px] text-amber-700">
                      {order.status === "DELIVERED" ? "Completed" : "Pending / Paid"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Need Assistance Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <HelpCircle className="size-4 text-slate-400" /> Need Help?
              </div>
              <p>
                Have questions about your delivery or items? Contact the seller directly or contact our 24/7 platform support team.
              </p>
              <Link
                to="/account/settings"
                className="text-orange-600 hover:text-orange-700 font-semibold inline-block pt-1"
              >
                Manage Account & Preferences →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
