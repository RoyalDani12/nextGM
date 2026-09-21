import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from "lucide-react";

export function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("checkoutId");
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Give Stripe's webhook a moment to process before showing the success page.
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [checkoutId]);

  if (isVerifying) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-gray-600">Confirming your payment...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl">
        {/* Success Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payment successful!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Thank you for your purchase. Your payment has been confirmed and all shops have been notified.
        </p>

        {checkoutId && (
          <div className="my-6 rounded-xl bg-gray-50 p-3 text-left">
            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Checkout Reference</span>
            <span className="font-mono text-xs text-gray-600 break-all">{checkoutId}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate("/customer-order")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Package className="h-4 w-4" />
            View My Orders
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
