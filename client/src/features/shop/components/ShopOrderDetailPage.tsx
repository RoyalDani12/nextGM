import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Printer,
  FileText,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  User,
  Loader2,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  useMarkShopOrderShipped,
  useUpdateShopOrderStatus,
  useShopOrder,
} from "@/features/shop/shop.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const getVariantName = (variant: unknown) => {
  if (typeof variant === "string") return variant;
  if (
    variant &&
    typeof variant === "object" &&
    "name" in variant &&
    typeof variant.name === "string"
  ) {
    return variant.name;
  }
  return null;
};

const orderStatusMap: Record<
  string,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  PENDING: {
    label: "Pending payment",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700",
    bgClass: "bg-blue-50 border-blue-200",
  },
  PROCESSING: {
    label: "Processing",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700",
    bgClass: "bg-sky-50 border-sky-200",
  },
  SHIPPED: {
    label: "Shipped",
    dotClass: "bg-indigo-500",
    textClass: "text-indigo-700",
    bgClass: "bg-indigo-50 border-indigo-200",
  },
  DELIVERED: {
    label: "Delivered",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
  },
  COMPLETED: {
    label: "Completed",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50 border-slate-200",
  },
  REFUNDED: {
    label: "Refunded",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700",
    bgClass: "bg-rose-50 border-rose-200",
  },
};

const nextStatusMap: Record<string, string | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: null,
  SHIPPED: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
  REFUNDED: null,
};

const nextStatusActionLabel: Record<string, string> = {
  PENDING: "Confirm order",
  CONFIRMED: "Start processing",
  SHIPPED: "Mark delivered",
};

export const ShopOrderDetailPage = () => {
  const { shopId, orderId } = useParams<{ shopId: string; orderId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useShopOrder(
    shopId ?? "",
    orderId ?? ""
  );
  const updateStatus = useUpdateShopOrderStatus();
  const markShipped = useMarkShopOrderShipped();

  const [shipmentForm, setShipmentForm] = useState({
    carrier: "",
    trackingNumber: "",
    trackingUrl: "",
    note: "",
  });
  const [printDocument, setPrintDocument] = useState<
    "packing-slip" | "invoice" | null
  >(null);

  const order = data?.data ?? data;

  if (isLoading) {
    return (
      <div className="flex min-h-[380px] items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="mx-auto size-5 animate-spin text-slate-400" />
          <p className="text-xs text-slate-500">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center max-w-md mx-auto space-y-3">
        <Package className="mx-auto size-8 text-slate-300" />
        <h2 className="text-sm font-semibold text-slate-900">
          Order not found
        </h2>
        <p className="text-xs text-slate-500">
          Could not retrieve details for order ID: {orderId}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="rounded-lg border-slate-200 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const nextStatus = nextStatusMap[order.status];
  const nextActionName = nextStatus ? nextStatusActionLabel[order.status] ?? `Mark as ${nextStatus}` : null;

  const handleStatusChange = () => {
    if (!shopId || !orderId || !nextStatus) return;
    updateStatus.mutate({
      shopId,
      orderId,
      status: nextStatus,
    });
  };

  const handleShipmentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!shopId || !orderId) return;
    markShipped.mutate({
      shopId,
      orderId,
      shipment: {
        carrier: shipmentForm.carrier.trim(),
        trackingNumber: shipmentForm.trackingNumber.trim() || undefined,
        trackingUrl: shipmentForm.trackingUrl.trim() || undefined,
        note: shipmentForm.note.trim() || undefined,
      },
    });
  };

  const printOrderDocument = (documentType: "packing-slip" | "invoice") => {
    setPrintDocument(documentType);
    window.setTimeout(() => window.print(), 100);
  };

  const {
    id,
    status,
    totalAmount,
    discountAmount,
    createdAt,
    items = [],
    shippingAddress,
    payment,
    statusHistory = [],
    shipment,
  } = order;

  const currentStatusMeta = orderStatusMap[status] ?? {
    label: status ?? "Unknown",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50 border-slate-200",
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      {/* PRINT-ONLY & PREVIEW MODAL */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-invoice, #printable-invoice * { visibility: visible !important; }
          #printable-invoice {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 32px !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Invoice & Packing Slip Modal Preview */}
      <Dialog
        open={Boolean(printDocument)}
        onOpenChange={(open) => !open && setPrintDocument(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-lg border border-slate-200 bg-slate-50 shadow-2xl">
          <DialogTitle className="sr-only">
            {printDocument === "invoice" ? "Order Invoice Preview" : "Packing Slip Preview"}
          </DialogTitle>

          {/* Sticky preview controls */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-xs px-6 py-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {printDocument === "invoice" ? "Invoice preview" : "Packing slip preview"}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Order #{id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintDocument(null)}
                className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-none"
              >
                <Printer size={13} />
                <span>Print document</span>
              </Button>
            </div>
          </div>

          {/* Document Sheet */}
          <div className="p-6 sm:p-8">
            <div
              id="printable-invoice"
              className="mx-auto max-w-2xl bg-white border border-slate-200 rounded-lg p-8 sm:p-10 shadow-xs text-slate-900 space-y-7 print:border-none print:shadow-none print:p-0 print:max-w-full"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    {order.shop?.profile?.logo ? (
                      <img
                        src={order.shop.profile.logo}
                        alt=""
                        className="size-10 rounded-md object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="size-10 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                        {(order.shop?.profile?.name || "S")[0]}
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {order.shop?.profile?.name || "Store"}
                      </h2>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {order.shop?.slug ? `/${order.shop.slug}` : "Storefront"}
                      </p>
                    </div>
                  </div>
                  {order.shop?.profile?.supportEmail && (
                    <p className="text-xs text-slate-500">
                      Support: {order.shop.profile.supportEmail}
                    </p>
                  )}
                  {order.shop?.profile?.address && (
                    <p className="text-xs text-slate-500">
                      {order.shop.profile.address}
                    </p>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    {printDocument === "invoice" ? "Invoice" : "Packing Slip"}
                  </h1>
                  <p className="text-xs font-mono font-medium text-slate-600">
                    {printDocument === "invoice" ? `INV-${id.slice(-8).toUpperCase()}` : `PACK-${id.slice(-8).toUpperCase()}`}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Date: {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {payment && (
                    <span className="inline-block mt-1 text-[10px] font-semibold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 uppercase">
                      {payment.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Two-Column Addresses */}
              <div className="grid grid-cols-2 gap-6 text-xs pb-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Billed to
                  </span>
                  <p className="font-semibold text-slate-900">
                    {order.customer?.name || shippingAddress?.fullName || "Valued Customer"}
                  </p>
                  {order.customer?.email && (
                    <p className="text-slate-600">{order.customer.email}</p>
                  )}
                  {shippingAddress?.phone && (
                    <p className="text-slate-500">{shippingAddress.phone}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Shipped to
                  </span>
                  <p className="font-semibold text-slate-900">
                    {shippingAddress?.fullName || "Same as billed"}
                  </p>
                  {shippingAddress?.address && (
                    <p className="text-slate-600 leading-relaxed">
                      {shippingAddress.address}
                      <br />
                      {shippingAddress.city}, {shippingAddress.country} {shippingAddress.postalCode}
                    </p>
                  )}
                  {shipment && (
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      Carrier: <strong className="font-medium text-slate-700">{shipment.carrier || shipment.method}</strong>
                      {shipment.trackingNumber && ` • Tracking: ${shipment.trackingNumber}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      {printDocument === "packing-slip" && (
                        <th className="py-2.5 px-3 w-8 text-center">Pack</th>
                      )}
                      <th className="py-2.5 px-3">Item description</th>
                      <th className="py-2.5 px-3">Variant</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      {printDocument === "invoice" && (
                        <>
                          <th className="py-2.5 px-3 text-right">Price</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item: any) => (
                      <tr key={item.id}>
                        {printDocument === "packing-slip" && (
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block size-3.5 border border-slate-300 rounded-xs" />
                          </td>
                        )}
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900">
                            {item.product?.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {item.variant?.sku || item.product?.sku || "—"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {getVariantName(item.variant) || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-800 tabular-nums">
                          {item.quantity}
                        </td>
                        {printDocument === "invoice" && (
                          <>
                            <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                              ${Number(item.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums">
                              ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary (For Invoice) */}
              {printDocument === "invoice" ? (
                <div className="flex justify-end pt-1">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-medium text-slate-900">
                        ${(Number(totalAmount) + Number(discountAmount || 0) - Number(shipment?.fee || 0)).toFixed(2)}
                      </span>
                    </div>
                    {Number(discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount applied</span>
                        <span className="tabular-nums">-${Number(discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping fee</span>
                      <span className="tabular-nums font-medium text-slate-900">
                        {Number(shipment?.fee || 0) === 0 ? "Free" : `$${Number(shipment?.fee).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                      <span>Total paid</span>
                      <span className="text-base tabular-nums">${Number(totalAmount).toFixed(2)}</span>
                    </div>
                    {payment && (
                      <p className="text-[11px] text-slate-400 text-right pt-0.5">
                        Paid via {payment.provider}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Packing Instructions:</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Verify all listed items and quantities before sealing. Include this packing slip inside the package.
                  </p>
                </div>
              )}

              {/* Footer Terms */}
              <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-600 font-medium">Thank you for your business.</p>
                {order.shop?.profile?.returnsPolicy && (
                  <p>
                    <strong>Returns & Refund policy:</strong> {order.shop.profile.returnsPolicy}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* BREADCRUMB NAVIGATION */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link
          to={`/dashboard/shop/${shopId}/orders`}
          className="hover:text-slate-700 transition-colors"
        >
          Orders
        </Link>
        <ChevronRight size={12} />
        <span className="font-mono text-slate-700 font-medium">
          #{id.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* HEADER SECTION */}
      <header className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/shop/${shopId}/orders`)}
            className="size-8 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to orders"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-semibold font-mono text-slate-900">
                Order #{id.slice(-8).toUpperCase()}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${currentStatusMeta.bgClass}`}
              >
                <span
                  className={`size-1.5 rounded-full ${currentStatusMeta.dotClass}`}
                />
                <span className={currentStatusMeta.textClass}>
                  {currentStatusMeta.label}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar size={12} className="text-slate-400" />
              <span>
                Placed on{" "}
                {new Date(createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printOrderDocument("packing-slip")}
            className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={13} />
            <span>Packing slip</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => printOrderDocument("invoice")}
            className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} />
            <span>Invoice</span>
          </Button>

          {nextActionName && (
            <Button
              size="sm"
              onClick={handleStatusChange}
              disabled={updateStatus.isPending}
              className="h-8 px-3.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              {updateStatus.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              <span>{nextActionName}</span>
            </Button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            className="size-8 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh order"
          >
            <RefreshCw
              size={13}
              className={isLoading ? "animate-spin text-orange-500" : ""}
            />
          </button>
        </div>
      </header>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Items, Dispatch form, Timeline (8 of 12 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* ORDER ITEMS TABLE */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={14} className="text-slate-400" />
                <h2 className="text-xs font-semibold text-slate-900">
                  Items ordered ({items.length})
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-medium">
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4 text-center">Quantity</th>
                    <th className="py-2.5 px-4 text-right">Unit price</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item: any) => {
                    const itemTotal = (
                      parseFloat(item.unitPrice) * item.quantity
                    ).toFixed(2);
                    const imageUrl = item.product?.images?.[0]?.url;
                    const variantName = getVariantName(item.variant);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.product?.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Package size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {item.product?.name ?? "Product Item"}
                              </p>
                              {variantName && (
                                <p className="text-[11px] text-slate-500">
                                  Variant: {variantName}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                SKU: {item.variant?.sku || item.product?.sku || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-800 tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                          ${Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                          ${itemTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DISPATCH / FULFILLMENT FORM (Active when PROCESSING) */}
          {status === "PROCESSING" && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-orange-600" />
                <h3 className="text-xs font-semibold text-slate-900">
                  Fulfill & ship order
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Enter shipment and tracking details to mark this order as dispatched.
              </p>

              <form onSubmit={handleShipmentSubmit} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Carrier <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={shipmentForm.carrier}
                      onChange={(e) =>
                        setShipmentForm((curr) => ({
                          ...curr,
                          carrier: e.target.value,
                        }))
                      }
                      placeholder={
                        shipment?.method === "PICKUP"
                          ? "Pickup location or contact"
                          : "e.g. DHL, FedEx, UPS"
                      }
                      className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                    />
                  </div>

                  {shipment?.method !== "PICKUP" && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-700">
                        Tracking number <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        value={shipmentForm.trackingNumber}
                        onChange={(e) =>
                          setShipmentForm((curr) => ({
                            ...curr,
                            trackingNumber: e.target.value,
                          }))
                        }
                        placeholder="e.g. 1Z9999999999999999"
                        className="h-9 text-xs rounded-lg border-slate-200 bg-white font-mono"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Tracking URL{" "}
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <Input
                      type="url"
                      value={shipmentForm.trackingUrl}
                      onChange={(e) =>
                        setShipmentForm((curr) => ({
                          ...curr,
                          trackingUrl: e.target.value,
                        }))
                      }
                      placeholder="https://track.carrier.com/..."
                      className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Shipment note{" "}
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <Input
                      value={shipmentForm.note}
                      onChange={(e) =>
                        setShipmentForm((curr) => ({
                          ...curr,
                          note: e.target.value,
                        }))
                      }
                      placeholder="e.g. Left at loading bay"
                      className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={markShipped.isPending}
                    className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer"
                  >
                    {markShipped.isPending ? (
                      <Loader2 size={13} className="mr-1.5 animate-spin" />
                    ) : (
                      <Truck size={13} className="mr-1.5" />
                    )}
                    <span>
                      {shipment?.method === "PICKUP"
                        ? "Notify ready for pickup"
                        : "Save & mark shipped"}
                    </span>
                  </Button>
                  {markShipped.isError && (
                    <span className="text-xs text-rose-600 font-medium">
                      Failed to save shipment. Please verify details and retry.
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* STATUS TIMELINE */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">
              Order timeline
            </h3>

            {statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400">No activity logged yet.</p>
            ) : (
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {statusHistory.map((step: any, index: number) => (
                  <div key={index} className="relative text-xs">
                    <span className="absolute -left-[19px] top-1 size-2 rounded-full bg-slate-400 ring-2 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 uppercase tracking-wide text-[11px]">
                        {step.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(step.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {step.note && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {step.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Customer, Shipping, Payment totals (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* SHIPPING & CUSTOMER DETAILS */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">
              Customer & shipping
            </h3>

            {/* Shipment summary if recorded */}
            {shipment && (
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center font-medium">
                  <span className="capitalize text-slate-800">
                    {shipment.method.replace("_", " ").toLowerCase()} delivery
                  </span>
                  <span className="tabular-nums text-slate-900">
                    {Number(shipment.fee) === 0
                      ? "Free"
                      : `$${Number(shipment.fee).toFixed(2)}`}
                  </span>
                </div>
                {shipment.trackingNumber && (
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-500">Tracking:</span>
                    {shipment.trackingUrl ? (
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                      >
                        <span>{shipment.trackingNumber}</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="font-mono text-slate-800">
                        {shipment.trackingNumber}
                      </span>
                    )}
                  </div>
                )}
                {shipment.estimatedDeliveryEnd && (
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Expected by{" "}
                    {new Date(shipment.estimatedDeliveryEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Address */}
            <div className="space-y-2 text-xs">
              {shippingAddress ? (
                <>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <User size={13} className="text-slate-400 shrink-0" />
                    <span>{shippingAddress.fullName}</span>
                  </div>
                  {shippingAddress.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{shippingAddress.phone}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-slate-600 pt-0.5">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p>{shippingAddress.address}</p>
                      <p>
                        {shippingAddress.city}, {shippingAddress.postalCode}
                      </p>
                      <p className="font-medium text-slate-800">
                        {shippingAddress.country}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-xs">No address specified.</p>
              )}
            </div>
          </div>

          {/* PAYMENT & FINANCIAL TOTALS */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">
              Payment summary
            </h3>

            {payment && (
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Method</span>
                  <span className="font-medium text-slate-800">
                    {payment.provider}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment status</span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <CreditCard size={12} className="text-slate-400" />
                    <span>{payment.status}</span>
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums text-slate-800">
                  $
                  {(
                    Number(totalAmount) +
                    Number(discountAmount || 0) -
                    Number(shipment?.fee || 0)
                  ).toFixed(2)}
                </span>
              </div>
              {Number(discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    -${Number(discountAmount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="tabular-nums text-slate-800">
                  {Number(shipment?.fee || 0) === 0
                    ? "Free"
                    : `$${Number(shipment?.fee).toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-semibold text-slate-900 text-sm">
                <span>Total amount</span>
                <span className="text-base tabular-nums">
                  ${Number(totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopOrderDetailPage;
