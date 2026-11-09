import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getCustomerOrderByIdRequest } from "../order/order.api";
import { useCancelCustomerOrder } from "./customerOrder.hook";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
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
  RotateCcw,
  Star,
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
  { key: "PLACED", label: "Order Placed", icon: ShoppingBag, statuses: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, statuses: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
  { key: "SHIPPED", label: "In Transit", icon: Truck, statuses: ["SHIPPED", "DELIVERED"] },
  { key: "DELIVERED", label: "Delivered", icon: PackageCheck, statuses: ["DELIVERED"] },
];

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

  // Always navigate back to orders list to prevent back button loops
  const goBack = () => {
    navigate("/customer-order");
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
      title: "Order ID copied",
      description: `Copied #${orderId.slice(-8).toUpperCase()} to clipboard`,
      type: "info",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelReturn = (returnId: string) => {
    cancelReturn.mutate(returnId, {
      onSuccess: () =>
        toast.add({
          title: "Return request cancelled",
          description: "The request has been cancelled.",
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
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-[#FDFCFB]">
        <RefreshCw className="size-8 animate-spin text-orange-500 mb-3" />
        <p className="text-xs font-bold text-slate-600 sm:text-sm">Loading order details...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-[#FDFCFB] p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Order not found</h2>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 sm:text-sm">
          We couldn&apos;t find this order. It may have been removed or you may not have permission to view it.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={goBack}
            className="rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
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
    <div className="min-h-screen bg-[#FDFCFB] pb-24 text-slate-900">
      {/* Creative Header */}
      <div className="border-b border-orange-100/70 bg-gradient-to-b from-orange-50/40 via-white to-[#FDFCFB] pt-6 pb-8 sm:pt-8 sm:pb-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={goBack}
                className="group mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/90 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-xs transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
              >
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to My Orders</span>
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <button
                  type="button"
                  onClick={copyId}
                  title="Copy full Order ID"
                  className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50/80 px-2.5 py-1 text-xs font-mono font-bold text-orange-700 transition hover:bg-orange-100"
                >
                  <Copy className="size-3" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="size-3.5 text-orange-500" />
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: "long",
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

            {/* Actions: Print Receipt, Start Return, Cancel */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
              >
                <Printer className="size-3.5" /> Print Receipt
              </button>

              {canCancel && (
                <button
                  type="button"
                  onClick={() => {
                    cancelOrder.reset();
                    setIsCancelDialogOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 shadow-2xs transition hover:bg-rose-50"
                >
                  <XCircle className="size-3.5" /> Cancel Order
                </button>
              )}

              {["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) && !activeReturn && (
                <button
                  type="button"
                  onClick={() => setIsReturnDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                >
                  <RotateCcw className="size-3.5" /> Request Return / Refund
                </button>
              )}

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  order.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isCancelled
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-orange-50 text-orange-700 border border-orange-200"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    order.status === "DELIVERED"
                      ? "bg-emerald-500"
                      : isCancelled
                      ? "bg-rose-500"
                      : "bg-orange-500 animate-pulse"
                  }`}
                />
                {order.status.replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        {/* Creative Fulfillment Journey Stepper */}
        {!isCancelled ? (
          <div className="rounded-3xl border border-orange-100/80 bg-white p-6 sm:p-7 shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Truck className="size-4 text-orange-500" />
                <span>Delivery Progress</span>
              </h2>
              <span className="text-xs font-bold text-orange-600">
                {order.status === "DELIVERED" ? "Delivered to recipient" : "In fulfillment pipeline"}
              </span>
            </div>

            <div className="relative">
              {/* Connecting progress bar */}
              <div className="absolute left-8 top-5 right-8 h-1 bg-slate-100 -z-0 hidden sm:block" />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-4 relative z-10">
                {orderSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center text-center p-3 sm:p-0 rounded-2xl transition ${
                        isCurrent ? "bg-orange-50/60 sm:bg-transparent" : ""
                      }`}
                    >
                      <div
                        className={`size-11 sm:size-12 rounded-2xl flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        } ${isCurrent ? "ring-4 ring-orange-100" : ""}`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span
                        className={`mt-2.5 text-xs ${
                          isCompleted ? "font-extrabold text-slate-900" : "font-semibold text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="mt-1 inline-block text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full">
                          Current Stage
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-rose-200/90 bg-rose-50/70 p-5 shadow-2xs flex items-center gap-4 text-rose-950">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200">
              <XCircle className="size-6" />
            </div>
            <div>
              <p className="font-bold text-sm">This order has been {order.status.toLowerCase()}</p>
              <p className="text-xs text-rose-700 mt-0.5">
                If payment was captured, your refund is processed according to store return policies.
              </p>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column: Items & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ordered Items Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-base font-black text-slate-900">
                  Ordered Items ({order.items?.length ?? 0})
                </h2>
                <span className="text-xs text-slate-400">
                  Sold by {shopProfile?.name || order.shop?.slug || "Merchant"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item: any) => {
                  const product = item.product;
                  const rawImg = product?.images?.[0];
                  const imageUrl = typeof rawImg === "string" ? rawImg : rawImg?.url;

                  return (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="size-16 shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50 overflow-hidden flex items-center justify-center shadow-2xs">
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

                        {/* Title, Variant & Price */}
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">
                            {product?.name || "Product Item"}
                          </p>
                          {item.variant?.name && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Variant: <span className="font-semibold text-slate-700">{item.variant.name}</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">
                            Qty: <span className="font-bold text-slate-800">{item.quantity}</span> · $
                            {Number(item.unitPrice).toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      {/* Total & Review */}
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-slate-900">
                          ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
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
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/70 hover:bg-amber-100 transition"
                          >
                            <Star className="size-3 fill-amber-400 text-amber-400" /> Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking History Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                <h2 className="text-base font-black text-slate-900 mb-4">
                  Order Status Updates
                </h2>
                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-orange-100">
                  {order.statusHistory.map((history: any, index: number) => (
                    <div key={index} className="relative">
                      {/* Step Indicator Dot */}
                      <div className="absolute -left-6 top-0.5 size-5 rounded-full border-2 border-white bg-orange-500 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
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
                          <p className="text-xs text-slate-600 mt-1.5 bg-orange-50/40 p-2.5 rounded-2xl border border-orange-100/60">
                            {displayText(history.note)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-5">
            {/* Merchant Card */}
            {order.shop && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">
                  Merchant
                </h3>
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
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
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {shopProfile?.name || order.shop.slug}
                    </p>
                    <p className="text-xs text-slate-500">@{order.shop.slug}</p>
                    {shopProfile?.phone && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{displayText(shopProfile.phone)}</p>
                    )}
                  </div>
                </div>

                <Link
                  to="/"
                  className="mt-4 block w-full text-center rounded-2xl border border-orange-200 bg-orange-50/50 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-100/80"
                >
                  Visit Storefront
                </Link>
              </div>
            )}

            {/* Shipping Destination */}
            {order.shippingAddress && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-orange-500" /> Shipping Destination
                </h3>
                <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  <p className="font-bold text-slate-900">{displayText(order.shippingAddress.fullName)}</p>
                  <p>{displayText(order.shippingAddress.address)}</p>
                  <p>
                    {displayText(order.shippingAddress.city)}, {displayText(order.shippingAddress.postalCode)}{" "}
                    ({displayText(order.shippingAddress.country)})
                  </p>
                  <p className="text-slate-400 pt-0.5">Phone: {displayText(order.shippingAddress.phone)}</p>
                </div>
              </div>
            )}

            {/* Delivery & Tracking */}
            {order.shipment && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Truck className="size-3.5 text-orange-500" /> Delivery & Tracking
                </h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {order.shipment.method.replace("_", " ")} delivery
                    </span>
                    <span className="font-bold text-slate-900">
                      {Number(order.shipment.fee) === 0 ? "Free" : `$${Number(order.shipment.fee).toFixed(2)}`}
                    </span>
                  </div>
                  {order.shipment.estimatedDeliveryEnd && (
                    <p>
                      Estimated by{" "}
                      <span className="font-semibold text-slate-800">
                        {new Date(order.shipment.estimatedDeliveryEnd).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                  {order.shipment.shippedAt && (
                    <p className="rounded-xl bg-orange-50 p-2 text-orange-800 text-[11px] font-medium border border-orange-100">
                      {order.shipment.method === "PICKUP" ? "Ready for pickup" : "Handed to carrier"}{" "}
                      {new Date(order.shipment.shippedAt).toLocaleDateString()}
                    </p>
                  )}
                  {order.shipment.carrier && (
                    <p>
                      Carrier: <span className="font-semibold text-slate-800">{order.shipment.carrier}</span>
                    </p>
                  )}
                  {order.shipment.trackingNumber && (
                    <p>
                      Tracking #:{" "}
                      <span className="font-mono font-bold text-slate-800">
                        {order.shipment.trackingNumber}
                      </span>
                    </p>
                  )}
                  {order.shipment.trackingUrl && (
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700"
                    >
                      Track with carrier <ExternalLink className="size-3" />
                    </a>
                  )}
                  {order.shipment.note && (
                    <p className="border-t border-slate-100 pt-2 text-slate-500">
                      {displayText(order.shipment.note)}
                    </p>
                  )}
                  {order.shipment.deliveredAt && (
                    <p className="rounded-xl bg-emerald-50 p-2 font-bold text-emerald-800 text-[11px] border border-emerald-100">
                      Delivered on {new Date(order.shipment.deliveredAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-orange-500" /> Payment Summary
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    $
                    {(
                      Number(order.totalAmount) +
                      Number(order.discountAmount || 0) -
                      Number(order.shipment?.fee || 0)
                    ).toFixed(2)}
                  </span>
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
                  <span className="font-semibold text-emerald-600">
                    {Number(order.shipment?.fee || 0) === 0
                      ? "FREE"
                      : `$${Number(order.shipment?.fee).toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-900">Total Paid</span>
                  <span className="font-black text-lg text-slate-900">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Badge */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                {order.payment ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      {order.payment.provider || "Card"}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-[10px] text-emerald-700 border border-emerald-200">
                      {order.payment.status}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <CreditCard className="size-4 text-orange-500" />
                      Payment
                    </span>
                    <span className="rounded-full bg-orange-50 px-2.5 py-0.5 font-bold text-[10px] text-orange-700 border border-orange-200">
                      {order.status === "DELIVERED" ? "Completed" : "Pending / Paid"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Return Request Card */}
            {activeReturn && (
              <div className="rounded-3xl border border-orange-200 bg-orange-50/60 p-5 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <RotateCcw className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                      Return Request
                    </p>
                    <p className="mt-0.5 text-xs font-black text-slate-900">
                      {activeReturn.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      {activeReturn.resolution === "REFUND" ? "Refund requested" : "Replacement requested"} · Submitted{" "}
                      {new Date(activeReturn.createdAt).toLocaleDateString()}
                    </p>
                    {["REQUESTED", "UNDER_REVIEW"].includes(activeReturn.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancelReturn(activeReturn.id)}
                        disabled={cancelReturn.isPending}
                        className="mt-2.5 text-xs font-bold text-orange-700 hover:text-orange-900 disabled:opacity-50"
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Platform Support Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <HelpCircle className="size-4 text-orange-500" /> Need Help?
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Have questions about your delivery or items? Contact the seller directly or contact our 24/7 customer support team.
              </p>
              <Link
                to="/account/settings"
                className="text-orange-600 hover:text-orange-700 font-bold inline-block pt-0.5 text-xs"
              >
                Manage Account & Preferences →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) && (
        <ReturnRequestDialog
          open={isReturnDialogOpen}
          onOpenChange={setIsReturnDialogOpen}
          orderId={order.id}
          items={order.items ?? []}
          onSubmitted={() => setIsReturnDialogOpen(false)}
        />
      )}

      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          if (!open && !cancelOrder.isPending) {
            setIsCancelDialogOpen(false);
            cancelOrder.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              This order is currently{" "}
              <strong>{order.status === "PENDING" ? "pending payment" : "confirmed"}</strong>, so it can still be cancelled.
              Orders cannot be cancelled after fulfillment or shipping has begun.
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
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                cancelOrder.reset();
                setIsCancelDialogOpen(false);
              }}
              disabled={cancelOrder.isPending}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={confirmCancellation}
              disabled={cancelOrder.isPending}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelOrder.isPending ? "Cancelling..." : "Yes, cancel order"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WriteReviewDialog
        productId={reviewProduct?.id || ""}
        productName={reviewProduct?.name || ""}
        productImage={reviewProduct?.image}
        isOpen={!!reviewProduct}
        onClose={() => setReviewProduct(null)}
      />

      <OrderInvoiceModal
        order={order}
        shopProfile={shopProfile}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </div>
  );
}
