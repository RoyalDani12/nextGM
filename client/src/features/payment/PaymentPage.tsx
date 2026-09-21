import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPaymentIntent } from "@/api/payment.api";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentForm({ checkoutId }: { checkoutId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    if (!elementReady) return;
    setSubmitting(true); setError(null);
    const returnUrl = new URL("/order-confirmation", window.location.origin);
    returnUrl.searchParams.set("checkoutId", checkoutId);
    const validation = await elements.submit();
    if (validation.error) { setError(validation.error.message ?? "Please check your payment details."); setSubmitting(false); return; }
    const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl.toString() } });
    if (result.error) { setError(result.error.message ?? "Payment could not be completed."); setSubmitting(false); }
  };

  return <form onSubmit={submit} className="space-y-5">
    <PaymentElement options={{ layout: "tabs" }} onReady={() => setElementReady(true)} onLoadError={() => setError("Stripe could not load the payment form. Check that the publishable key matches the server's Stripe account and mode.")} />
    {error && <p className="text-sm text-red-600">{error}</p>}
    <button disabled={!stripe || !elementReady || submitting} className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50">{submitting ? "Confirming payment…" : elementReady ? "Pay securely" : "Loading secure form…"}</button>
  </form>;
}

export default function PaymentPage() {
  const { checkoutId } = useParams<{ checkoutId: string }>();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) return;
    createPaymentIntent(checkoutId)
      .then(({ clientSecret }) => setClientSecret(clientSecret))
      .catch((err) => setError(err?.response?.data?.message ?? "Unable to initialize secure payment."));
  }, [checkoutId]);

  if (!checkoutId || !stripePromise || !publishableKey) return <PaymentError message="Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to the client environment." />;
  if (error) return <PaymentError message={error} />;
  if (!clientSecret) return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600">Preparing secure payment…</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">Secure payment</h1>
        <p className="mt-2 text-sm text-gray-600">Complete payment for your order. Your card details are handled by Stripe.</p>
        <div className="mt-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm checkoutId={checkoutId} />
          </Elements>
        </div>
        <button onClick={() => navigate("/customer-order")} className="mt-4 w-full text-sm text-gray-600 hover:text-black">View my orders instead</button>
      </section>
    </div>
  );
}

function PaymentError({ message }: { message: string }) {
  const navigate = useNavigate();
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4"><section className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm"><h1 className="text-xl font-semibold text-red-600">Payment unavailable</h1><p className="mt-2 text-sm text-gray-600">{message}</p><button onClick={() => navigate("/customer-order")} className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">View my orders</button></section></div>;
}
