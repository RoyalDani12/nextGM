import { Printer, X, CheckCircle2, ShieldCheck, Store, MapPin, Mail } from "lucide-react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OrderInvoiceModalProps {
    order: any;
    shopProfile?: any;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderInvoiceModal({
    order,
    shopProfile,
    isOpen,
    onClose,
}: OrderInvoiceModalProps) {
    if (!order) return null;

    const handlePrint = () => {
        window.print();
    };

    const invoiceNumber = `INV-${order.id.slice(-8).toUpperCase()}`;
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const subtotal = (
        Number(order.totalAmount) +
        Number(order.discountAmount || 0) -
        Number(order.shipment?.fee || 0)
    ).toFixed(2);

    const shippingAddress = order.shippingAddress;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl bg-white border border-slate-200">
                {/* Print Control Toolbar (Hidden during print) */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                            Order Receipt #{invoiceNumber}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Paid
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handlePrint}
                            className="rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs px-4 h-8 gap-1.5 font-semibold"
                        >
                            <Printer className="size-3.5" /> Print / Save PDF
                        </Button>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div id="printable-invoice" className="p-8 sm:p-10 text-slate-900 bg-white space-y-8">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-slate-100 pb-8">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-base">
                                    N
                                </span>
                                <div>
                                    <h1 className="text-xl font-black tracking-tight text-slate-900">
                                        Nexions
                                    </h1>
                                    <p className="text-[11px] text-slate-400">
                                        Multi-Tenant Commerce Platform
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 text-xs text-slate-500 space-y-0.5">
                                <p className="font-semibold text-slate-800">
                                    Sold by: {shopProfile?.name || order.shop?.slug || "Merchant"}
                                </p>
                                <p className="flex items-center gap-1">
                                    <Store className="size-3 text-slate-400" />
                                    Store ID: {order.shopId}
                                </p>
                            </div>
                        </div>

                        <div className="sm:text-right">
                            <span className="inline-block text-xs font-black uppercase tracking-widest text-slate-400">
                                Official Invoice
                            </span>
                            <p className="text-xl font-black font-mono text-slate-900 mt-0.5">
                                #{invoiceNumber}
                            </p>
                            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                                <p>Date: <span className="font-semibold text-slate-800">{orderDate}</span></p>
                                <p>Payment: <span className="font-semibold text-emerald-600">Card via Stripe (Paid)</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Shipping Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-8">
                        <div>
                            <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2">
                                Customer Details
                            </h2>
                            <p className="font-bold text-slate-900 text-sm">
                                {order.customer?.name || "Customer"}
                            </p>
                            <p className="text-slate-500 flex items-center gap-1 mt-1">
                                <Mail className="size-3 text-slate-400" />
                                {order.customer?.email}
                            </p>
                        </div>

                        <div>
                            <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2">
                                Shipped To
                            </h2>
                            {shippingAddress ? (
                                <div className="text-slate-600 space-y-0.5">
                                    <p className="font-semibold text-slate-900">
                                        {shippingAddress.fullName || order.customer?.name}
                                    </p>
                                    <p className="flex items-start gap-1">
                                        <MapPin className="size-3 text-slate-400 shrink-0 mt-0.5" />
                                        <span>
                                            {shippingAddress.address}, {shippingAddress.city},{" "}
                                            {shippingAddress.country} {shippingAddress.postalCode}
                                        </span>
                                    </p>
                                    {shippingAddress.phone && (
                                        <p className="text-slate-400 mt-1">Phone: {shippingAddress.phone}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">No physical address required (Digital)</p>
                            )}
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div>
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="pb-3">Item Description</th>
                                    <th className="pb-3 text-center">Qty</th>
                                    <th className="pb-3 text-right">Unit Price</th>
                                    <th className="pb-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items?.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-3.5 pr-4">
                                            <p className="font-bold text-slate-900">
                                                {item.product?.name || "Product Item"}
                                            </p>
                                            {item.variant?.name && (
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Variant: {item.variant.name}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-3.5 text-center font-semibold text-slate-700">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3.5 text-right font-medium text-slate-600">
                                            ${Number(item.unitPrice).toFixed(2)}
                                        </td>
                                        <td className="py-3.5 text-right font-bold text-slate-900">
                                            ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                        <div className="w-full sm:w-72 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-semibold text-slate-800">${subtotal}</span>
                            </div>

                            {Number(order.discountAmount) > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Discount</span>
                                    <span>-${Number(order.discountAmount).toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-slate-500">
                                <span>Shipping Fee</span>
                                <span className="font-semibold text-slate-800">
                                    {Number(order.shipment?.fee || 0) === 0
                                        ? "FREE"
                                        : `$${Number(order.shipment.fee).toFixed(2)}`}
                                </span>
                            </div>

                            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                                <span>Total Paid</span>
                                <span>${Number(order.totalAmount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Verification */}
                    <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400 gap-3">
                        <p className="flex items-center gap-1.5">
                            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                            Verified purchase & payment settled through Nexions Secure Payments.
                        </p>
                        <p>Thank you for your purchase!</p>
                    </div>
                </div>

                {/* Print Media Query CSS injection */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-invoice, #printable-invoice * {
                            visibility: visible;
                        }
                        #printable-invoice {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 24px;
                            margin: 0;
                            box-shadow: none !important;
                            border: none !important;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
