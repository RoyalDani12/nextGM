import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getCustomerOrderByIdRequest } from "../order/order.api";
import { useCancelCustomerOrder } from "./customerOrder.hook";
import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Package,
  Printer,
  RefreshCw,
  RotateCcw,
  Star,
  Store,
  XCircle,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReturnRequestDialog } from "@/features/returns/ReturnRequestDialog";
import { useCancelReturnRequest, useCustomerReturns } from "@/features/returns/return.hooks";
import { WriteReviewDialog } from "./components/WriteReviewDialog";
import { OrderInvoiceModal } from "./components/OrderInvoiceModal";

const orderSteps = [
  { key: "PLACED", label: "Placed", statuses: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
  { key: "CONFIRMED", label: "Confirmed", statuses: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
  { key: "SHIPPED", label: "In transit", statuses: ["SHIPPED", "DELIVERED"] },
  { key: "DELIVERED", label: "Delivered", statuses: ["DELIVERED"] },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return {
        label: "Delivered",
        dotClass: "bg-emerald-500",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      };
    case "SHIPPED":
      return {
        label: "In transit",
        dotClass: "bg-indigo-500",
        badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
      };
    case "PROCESSING":
      return {
        label: "Processing",
        dotClass: "bg-sky-500",
        badgeClass: "bg-sky-50 text-sky-800 border-sky-200/80",
      };
    case "CONFIRMED":
      return {
        label: "Confirmed",
        dotClass: "bg-blue-500",
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
      };
    case "PENDING":
      return {
        label: "Payment pending",
        dotClass: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      };
    case "REFUNDED":
      return {
        label: "Refunded",
        dotClass: "bg-rose-500",
        badgeClass: "bg-rose-50 text-rose-800 border-rose-200/80",
      };
    default:
      return {
        label: status,
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
};

const displayText = (value: unknown, fallback = ""): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
};

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const cancelOrder = useCancelCustomerOrder();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<{ id: string; name: string; image?: string | null } | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const { data: customerReturns = [] } = useCustomerReturns();
  const cancelReturn = useCancelReturnRequest();

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-order", orderId],
    queryFn: () => getCustomerOrderByIdRequest(orderId!),
    enabled: !!orderId,
  });

  const order = response?.data;
  const [copied, setCopied] = useState(false);
  const canCancel = order?.status === "PENDING" || order?.status === "CONFIRMED";
  const orderReturns = customerReturns.filter((returnRequest) => returnRequest.orderId === orderId);
  const activeReturn = orderReturns.find((returnRequest) => returnRequest.status !== "CANCELLED");

  // Prevent back button loops: check history state
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/orders");
    }
  };

  const confirmCancellation = () => {
    if (!orderId) return;

    cancelOrder.mutate(orderId, {
      onSuccess: () => {
        setIsCancelDialogOpen(false);
        toast.add({
          title: "Order cancelled",
          description: `Order #${orderId.slice(-8).toUpperCase()} has been cancelled.`,
          type: "success",
        });
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? error.response?.data?.message
          : error instanceof Error
            ? error.message
            : "Unable to cancel this order.";
        toast.add({
          title: "Cancellation failed",
          description: typeof message === "string" ? message : "Unable to cancel this order.",
          type: "error",
        });
      },
    });
  };

  const copyId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    toast.add({
      title: "Order reference copied",
      description: `#${orderId.slice(-8).toUpperCase()}`,
      type: "info",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelReturn = (returnId: string) => {
    cancelReturn.mutate(returnId, {
      onSuccess: () =>
        toast.add({
          title: "Return request cancelled",
          description: "The request has been withdrawn.",
          type: "success",
        }),
      onError: (error) =>
        toast.add({
          title: "Could not cancel return",
          description: error instanceof Error ? error.message : "Please try again.",
          type: "error",
        }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-slate-50/50">
        <RefreshCw className="size-6 animate-spin text-orange-600 mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading order details...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
          <Package className="size-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Order not found</h2>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          We could not locate this purchase or you may not have permission to view it.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const shopProfile = order.shop?.profile;
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const statusBadge = getStatusBadge(order.status);

  // Stepper calculations
  let currentStepIdx = 0;
  if (order.status === "DELIVERED" || order.status === "COMPLETED") currentStepIdx = 3;
  else if (order.status === "SHIPPED") currentStepIdx = 2;
  else if (order.status === "CONFIRMED" || order.status === "PROCESSING") currentStepIdx = 1;
  else if (order.status === "PENDING") currentStepIdx = 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 text-slate-900">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-orange-500 hover:text-orange-600 active:scale-95"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Orders</span>
            </button>
            <div className="text-xs font-semibold text-slate-400">
              Order #{order.id.slice(-8).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl font-mono">
                #{order.id.slice(-8).toUpperCase()}
              </h1>
              <button
                type="button"
                onClick={copyId}
                title="Copy reference ID"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Copy className="size-3" />
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${statusBadge.badgeClass}`}
              >
                <span className={`size-1.5 rounded-full ${statusBadge.dotClass}`} />
                <span>{statusBadge.label}</span>
              </span>
            </div>

            <p className="mt-1.5 text-xs text-slate-500">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-orange-500 hover:text-orange-600 active:scale-95"
            >
              <Printer className="size-3.5 text-slate-400" />
              <span>Invoice</span>
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={() => {
                  cancelOrder.reset();
                  setIsCancelDialogOpen(true);
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-50 active:scale-95"
              >
                <XCircle className="size-3.5 text-rose-500" />
                <span>Cancel order</span>
              </button>
            )}

            {["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) && !activeReturn && (
              <button
                type="button"
                onClick={() => setIsReturnDialogOpen(true)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
              >
                <RotateCcw className="size-3.5" />
                <span>Request return</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fulfillment Status Tracker */}
            {!isCancelled ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Fulfillment status
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {order.status === "DELIVERED"
                      ? "Shipment delivered"
                      : order.shipment?.estimatedDeliveryEnd
                      ? `Estimated arrival: ${new Date(order.shipment.estimatedDeliveryEnd).toLocaleDateString()}`
                      : "Processing shipment"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {orderSteps.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step.key} className="space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isPassed ? "bg-orange-600" : "bg-slate-200"
                          }`}
                        />
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={
                              isCurrent
                                ? "font-bold text-orange-600"
                                : isPassed
                                ? "font-semibold text-slate-800"
                                : "text-slate-400"
                            }
                          >
                            {step.label}
                          </span>
                          {isPassed && <Check className="size-3 text-orange-600 inline" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-center gap-3">
                <XCircle className="size-4 text-slate-500 shrink-0" />
                <span>
                  This order was <strong>{order.status.toLowerCase()}</strong>. If your card was charged, funds are credited back to your original payment method.
                </span>
              </div>
            )}

            {/* Line Items Table */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  Items ({order.items?.length ?? 0})
                </h2>
                <span className="text-xs text-slate-500">
                  Fulfillment by {shopProfile?.name || order.shop?.slug || "Merchant"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item: any) => {
                  const product = item.product;
                  const rawImg = product?.images?.[0];
                  const imageUrl = typeof rawImg === "string" ? rawImg : rawImg?.url;
                  const lineTotal = Number(item.unitPrice) * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 transition hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="size-12 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product?.name || "Product"}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Package className="size-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                            {product?.name || "Product Item"}
                          </p>
                          {item.variant?.name && (
                            <p className="text-xs text-slate-500">
                              Option: {item.variant.name}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">
                            Qty {item.quantity} · ${Number(item.unitPrice).toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      {/* Right Total & Review action */}
                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                          ${lineTotal.toFixed(2)}
                        </p>
                        {order.status === "DELIVERED" && product?.id && (
                          <button
                            type="button"
                            onClick={() =>
                              setReviewProduct({
                                id: product.id,
                                name: product.name || "Product",
                                image: imageUrl ?? null,
                              })
                            }
                            className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 text-xs font-bold shadow-2xs transition active:scale-95"
                          >
                            <Star className="size-3 fill-white text-white" />
                            <span>Review</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery & Tracking Details */}
            {order.shipment && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Shipment & carrier
                  </h3>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {order.shipment.method.replace("_", " ")} delivery
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400">Carrier</p>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {order.shipment.carrier || "Standard Carrier"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Tracking reference</p>
                    {order.shipment.trackingNumber ? (
                      <p className="font-mono font-bold text-slate-900 mt-0.5">
                        {order.shipment.trackingNumber}
                      </p>
                    ) : (
                      <p className="text-slate-500 mt-0.5">Assigned upon dispatch</p>
                    )}
                  </div>
                </div>

                {order.shipment.trackingUrl && (
                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
                    >
                      <span>Track shipment with carrier</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Audit Log / Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Order activity log
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {order.statusHistory.map((history: any, index: number) => (
                    <div key={index} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {history.status.replaceAll("_", " ")}
                        </p>
                        {history.note && (
                          <p className="text-slate-500 mt-0.5">{displayText(history.note)}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(history.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* Payment & Financial Ledger */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3.5">
                Financial summary
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900">
                    $
                    {(
                      Number(order.totalAmount) +
                      Number(order.discountAmount || 0) -
                      Number(order.shipment?.fee || 0)
                    ).toFixed(2)}
                  </span>
                </div>

                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
                    <span className="font-mono">-${Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span className="font-mono text-slate-900">
                    {Number(order.shipment?.fee || 0) === 0
                      ? "Free"
                      : `$${Number(order.shipment?.fee).toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                  <span>Total paid</span>
                  <span className="font-mono text-base font-extrabold text-slate-900">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment provider status */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-slate-400" />
                  <span>{order.payment?.provider || "Card"} payment</span>
                </span>
                <span className="font-semibold text-slate-700">
                  {order.payment?.status || (order.status === "DELIVERED" ? "Settled" : "Authorized")}
                </span>
              </div>
            </div>

            {/* Shipping Destination */}
            {order.shippingAddress && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Shipping destination
                </h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">{displayText(order.shippingAddress.fullName)}</p>
                  <p>{displayText(order.shippingAddress.address)}</p>
                  <p>
                    {displayText(order.shippingAddress.city)}, {displayText(order.shippingAddress.postalCode)}{" "}
                    ({displayText(order.shippingAddress.country)})
                  </p>
                  {order.shippingAddress.phone && (
                    <p className="text-slate-400 pt-1">Phone: {displayText(order.shippingAddress.phone)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Merchant Information */}
            {order.shop && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Merchant
                </h3>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {shopProfile?.logo ? (
                      <img
                        src={shopProfile.logo}
                        alt={shopProfile.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Store className="size-5 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {shopProfile?.name || order.shop.slug}
                    </p>
                    <p className="text-[11px] text-slate-400">@{order.shop.slug}</p>
                  </div>
                </div>

                <Link
                  to="/"
                  className="mt-4 block w-full text-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-4 text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
                >
                  Visit store
                </Link>
              </div>
            )}

            {/* Active Return Claim */}
            {activeReturn && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Return claim #{activeReturn.id.slice(-6).toUpperCase()}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-900">
                  Status: {activeReturn.status.replaceAll("_", " ")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeReturn.resolution === "REFUND" ? "Refund resolution" : "Replacement resolution"}
                </p>
                {["REQUESTED", "UNDER_REVIEW"].includes(activeReturn.status) && (
                  <button
                    type="button"
                    onClick={() => handleCancelReturn(activeReturn.id)}
                    disabled={cancelReturn.isPending}
                    className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 disabled:opacity-50"
                  >
                    Withdraw claim
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Return Request Modal */}
      {["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) && (
        <ReturnRequestDialog
          open={isReturnDialogOpen}
          onOpenChange={setIsReturnDialogOpen}
          orderId={order.id}
          items={order.items ?? []}
          onSubmitted={() => setIsReturnDialogOpen(false)}
        />
      )}

      {/* Cancellation Dialog */}
      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          if (!open && !cancelOrder.isPending) {
            setIsCancelDialogOpen(false);
            cancelOrder.reset();
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order #{order.id.slice(-8).toUpperCase()}? If authorized or captured, your payment will be refunded.
            </DialogDescription>
          </DialogHeader>

          {cancelOrder.isError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200">
              {isAxiosError(cancelOrder.error) && typeof cancelOrder.error.response?.data?.message === "string"
                ? cancelOrder.error.response.data.message
                : cancelOrder.error instanceof Error
                  ? cancelOrder.error.message
                  : "Unable to cancel this order."}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => {
                cancelOrder.reset();
                setIsCancelDialogOpen(false);
              }}
              disabled={cancelOrder.isPending}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={confirmCancellation}
              disabled={cancelOrder.isPending}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
            >
              {cancelOrder.isPending ? "Cancelling..." : "Cancel order"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Review Modal */}
      <WriteReviewDialog
        productId={reviewProduct?.id || ""}
        productName={reviewProduct?.name || ""}
        productImage={reviewProduct?.image}
        isOpen={!!reviewProduct}
        onClose={() => setReviewProduct(null)}
      />

      {/* Invoice Modal */}
      <OrderInvoiceModal
        order={order}
        shopProfile={shopProfile}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </div>
  );
}
