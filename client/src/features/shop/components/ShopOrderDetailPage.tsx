import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
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
} from "lucide-react";
import { useMarkShopOrderShipped, useUpdateShopOrderStatus } from "@/features/shop/shop.hooks";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useShopOrder } from "@/features/shop/shop.hooks";

const getVariantName = (variant: unknown) => {
  if (typeof variant === "string") return variant;
  if (variant && typeof variant === "object" && "name" in variant && typeof variant.name === "string") {
    return variant.name;
  }
  return null;
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
  const [shipmentForm, setShipmentForm] = useState({ carrier: "", trackingNumber: "", trackingUrl: "", note: "" });
  const [printDocument, setPrintDocument] = useState<"packing-slip" | "invoice" | null>(null);

  // Extract order object from response safely
  const order = data?.data ?? data;

  // Render status badge with contextual styling
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return (
          <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 hover:bg-green-500/25">
            {status}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 hover:bg-amber-500/25">
            {status}
          </Badge>
        );
      case "EXPIRED":
      case "CANCELLED":
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 hover:bg-red-500/25">
            {status}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status ?? "UNKNOWN"}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading order details...</span>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <Package className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Failed to load order</h3>
          <p className="text-sm text-muted-foreground">
            Could not retrieve details for order ID: {orderId}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }
  const nextStatusMap: Record<string, string | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: null,
  SHIPPED: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
  REFUNDED: null,
};

const nextStatus = nextStatusMap[order.status];

  const handleStatusChange = () => {
  if (!shopId || !orderId || !nextStatus) return;

  updateStatus.mutate({
    shopId,
    orderId,
    status: nextStatus,
  });
}

  const handleShipmentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!shopId || !orderId) return;
    markShipped.mutate({
      shopId,
      orderId,
      shipment: {
        carrier: shipmentForm.carrier,
        trackingNumber: shipmentForm.trackingNumber || undefined,
        trackingUrl: shipmentForm.trackingUrl || undefined,
        note: shipmentForm.note || undefined,
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

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <style>{`
        .print-only { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { display: block !important; position: fixed !important; inset: 0 !important; }
        }
      `}</style>
      {printDocument && (
        <div className="print-only fixed inset-0 z-[100] bg-white p-8 text-slate-950">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div className="flex items-center gap-3">
                {order.shop?.profile?.logo && <img src={order.shop.profile.logo} alt="" className="h-14 w-14 object-contain" />}
                <div>
                  <h1 className="text-2xl font-black">{order.shop?.profile?.name || "Your Store"}</h1>
                  <p className="text-sm text-slate-500">{printDocument === "invoice" ? "Order Invoice" : "Packing Slip"}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold">Order #{id.slice(-8).toUpperCase()}</p>
                <p>{new Date(createdAt).toLocaleDateString()}</p>
                <div className="mt-2 h-8 w-40 bg-[repeating-linear-gradient(90deg,#111_0,#111_2px,transparent_2px,transparent_5px)]" aria-label={`Order barcode ${id}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-b py-6 text-sm">
              <div><p className="mb-1 text-xs font-bold uppercase text-slate-500">Ship to</p><p className="font-bold">{shippingAddress?.fullName}</p><p>{shippingAddress?.address}</p><p>{shippingAddress?.city}, {shippingAddress?.country} {shippingAddress?.postalCode}</p><p>{shippingAddress?.phone}</p></div>
              <div><p className="mb-1 text-xs font-bold uppercase text-slate-500">Customer</p><p>{order.customer?.name}</p><p>{order.customer?.email}</p><p className="mt-3"><strong>Status:</strong> {status}</p></div>
            </div>
            <table className="mt-6 w-full border-collapse text-sm">
              <thead><tr className="border-b-2 border-slate-900 text-left"><th className="py-2">Item / SKU</th><th className="py-2">Variant</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Amount</th></tr></thead>
              <tbody>{items.map((item: any) => <tr key={item.id} className="border-b"><td className="py-3"><strong>{item.product?.name}</strong><br /><span className="text-xs text-slate-500">SKU: {item.variant?.sku || item.product?.sku || "—"}</span></td><td className="py-3">{getVariantName(item.variant) || "—"}</td><td className="py-3 text-center">{item.quantity}</td><td className="py-3 text-right">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</td></tr>)}</tbody>
            </table>
            <div className="mt-6 flex justify-end"><div className="w-56 space-y-2 text-right text-sm"><p className="flex justify-between"><span>Subtotal</span><strong>${Number(totalAmount).toFixed(2)}</strong></p><p className="flex justify-between text-base"><span>Total</span><strong>${Number(totalAmount).toFixed(2)}</strong></p></div></div>
            {order.shop?.profile?.returnsPolicy && <p className="mt-10 border-t pt-4 text-xs text-slate-500"><strong>Returns policy:</strong> {order.shop.profile.returnsPolicy}</p>}
          </div>
        </div>
      )}
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/dashboard/shop/${shopId}/orders`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                Order #{id.slice(-8)}
              </h1>
              {renderStatusBadge(status)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              Placed on {new Date(createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Details
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => printOrderDocument("packing-slip")}>
          <Printer className="mr-2 h-4 w-4" /> Print Packing Slip
        </Button>
        <Button variant="outline" onClick={() => printOrderDocument("invoice")}>
          <FileText className="mr-2 h-4 w-4" /> Generate Invoice
        </Button>
 {nextStatus && (
  <Button
    onClick={handleStatusChange}
    disabled={updateStatus.isPending}
  >
    {updateStatus.isPending
      ? "Updating..."
      : `Mark as ${nextStatus}`}
  </Button>
)}
        {status === "PROCESSING" && (
          <span className="text-sm font-medium text-muted-foreground">Add dispatch details below to mark this order as shipped.</span>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) - Order Items & Status Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Order Items ({items.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => {
                    const itemTotal = (
                      parseFloat(item.unitPrice) * item.quantity
                    ).toFixed(2);
                    const imageUrl = item.product?.images?.[0]?.url;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.product?.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm line-clamp-1">
                                {item.product?.name ?? "Product Item"}
                              </p>
                              {getVariantName(item.variant) && (
                                <p className="text-xs text-muted-foreground">
                                  Variant: {getVariantName(item.variant)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.unitPrice}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${itemTotal}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {status === "PROCESSING" && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /><CardTitle className="text-base">Dispatch this order</CardTitle></div>
                <p className="text-xs text-muted-foreground">Save the carrier and tracking information before notifying the customer.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleShipmentSubmit} className="grid gap-3 sm:grid-cols-2">
                  <input required value={shipmentForm.carrier} onChange={(event) => setShipmentForm((current) => ({ ...current, carrier: event.target.value }))} placeholder={shipment?.method === "PICKUP" ? "Pickup location or contact" : "Carrier (e.g. DHL)"} className="h-10 rounded-md border bg-background px-3 text-sm" />
                  {shipment?.method !== "PICKUP" && <input required value={shipmentForm.trackingNumber} onChange={(event) => setShipmentForm((current) => ({ ...current, trackingNumber: event.target.value }))} placeholder="Tracking number" className="h-10 rounded-md border bg-background px-3 text-sm" />}
                  <input value={shipmentForm.trackingUrl} onChange={(event) => setShipmentForm((current) => ({ ...current, trackingUrl: event.target.value }))} placeholder="Tracking link (optional)" type="url" className="h-10 rounded-md border bg-background px-3 text-sm" />
                  <input value={shipmentForm.note} onChange={(event) => setShipmentForm((current) => ({ ...current, note: event.target.value }))} placeholder="Delivery note (optional)" className="h-10 rounded-md border bg-background px-3 text-sm" />
                  <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit" disabled={markShipped.isPending}>{markShipped.isPending ? "Sending update..." : shipment?.method === "PICKUP" ? "Notify ready for pickup" : "Save & mark as shipped"}</Button>{markShipped.isError && <span className="text-xs text-destructive">Could not save shipment. Check the details and try again.</span>}</div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Status Timeline History */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Order History & Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {statusHistory.map((step: any, index: number) => (
                  <div key={index} className="relative flex flex-col gap-1">
                    <span className="absolute -left-[23px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-primary">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {step.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(step.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {step.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col) - Shipping, Payment & Summary */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Shipping Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {shipment && (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                  <div className="flex justify-between font-semibold"><span>{shipment.method.replace("_", " ")} delivery</span><span>{Number(shipment.fee) === 0 ? "Free" : `$${Number(shipment.fee).toFixed(2)}`}</span></div>
                  {shipment.estimatedDeliveryEnd && <p className="mt-1 text-muted-foreground">Expected by {new Date(shipment.estimatedDeliveryEnd).toLocaleDateString()}</p>}
                  {shipment.trackingNumber && <p className="mt-1 font-medium">Tracking: {shipment.trackingNumber}</p>}
                </div>
              )}
              {shippingAddress ? (
                <>
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{shippingAddress.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{shippingAddress.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground pt-1">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{shippingAddress.address}</p>
                      <p>
                        {shippingAddress.city}, {shippingAddress.postalCode}
                      </p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {shippingAddress.country}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">No address specified.</p>
              )}
            </CardContent>
          </Card>

          {/* Payment & Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Payment Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {payment && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 mb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-semibold">{payment.provider}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant="outline" className="text-[10px] py-0 h-5">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${(Number(totalAmount) + Number(discountAmount || 0) - Number(shipment?.fee || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-${discountAmount || "0.00"}</span>
              </div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{Number(shipment?.fee || 0) === 0 ? "Free" : `$${Number(shipment?.fee).toFixed(2)}`}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total Amount</span>
                <span className="text-primary">${totalAmount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShopOrderDetailPage;
