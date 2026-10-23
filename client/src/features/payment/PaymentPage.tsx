import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Check, CreditCard, LockKeyhole } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPaymentIntent } from "./payment.api";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentForm({ checkoutId, onLoadError }: { checkoutId: string; onLoadError: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !elementReady || submitting) return;
    setSubmitting(true);
    setError(null);
    const returnUrl = new URL("/order-confirmation", window.location.origin);
    returnUrl.searchParams.set("checkoutId", checkoutId);
    const validation = await elements.submit();
    if (validation.error) {
      setError(validation.error.message ?? "Please check your payment details.");
      setSubmitting(false);
      return;
    }
    const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl.toString() } });
    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {!elementReady && <div className="flex items-center gap-3 rounded-xl border border-dashed bg-gray-50 px-4 py-3 text-sm text-gray-600"><span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" />Loading the secure card form…</div>}
      <PaymentElement
        options={{ layout: "tabs" }}
        onReady={() => setElementReady(true)}
        onLoadError={() => {
          setError("Stripe could not load the payment form.");
          onLoadError();
        }}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={!stripe || !elementReady || submitting} className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? "Confirming payment…" : elementReady ? "Pay securely" : "Loading secure form…"}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const { checkoutId } = useParams<{ checkoutId: string }>();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setClientSecret(null);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  const handleStripeLoadError = useCallback(() => {
    setError("Stripe could not load the payment form. Please try again.");
  }, []);

  useEffect(() => {
    if (!checkoutId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    createPaymentIntent(checkoutId)
      .then(({ clientSecret: secret }) => {
        if (!cancelled) setClientSecret(secret);
      })
      .catch((requestError) => {
        if (!cancelled) {
          const message = requestError?.response?.data?.message;
          const isTransientServerError = requestError?.response?.status >= 500;
          if (isTransientServerError && attempt === 0) {
            // A checkout can reach this page while its payment record is being
            // finalized. Retry once silently instead of showing a failure UI.
            window.setTimeout(() => {
              if (!cancelled) setAttempt(1);
            }, 600);
            return;
          }
          setError(message === "Something went wrong. please try again later."
            ? "We could not start payment. Your order is still pending—please try again."
            : message ?? "Unable to initialize secure payment.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [checkoutId, attempt]);

  if (!checkoutId || !stripePromise || !publishableKey) {
    return <PaymentError message="Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to the client environment." />;
  }
  if (error) return <PaymentError message={error} onRetry={retry} />;
  if (isLoading || !clientSecret) {
    return <PaymentLoading />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">Secure payment</h1>
        <p className="mt-2 text-sm text-gray-600">Complete payment for your order. Your card details are handled by Stripe.</p>
        <div className="mt-6"><Elements key={`${checkoutId}-${attempt}`} stripe={stripePromise} options={{ clientSecret }}><PaymentForm checkoutId={checkoutId} onLoadError={handleStripeLoadError} /></Elements></div>
        <button onClick={() => navigate("/customer-order")} className="mt-4 w-full text-sm text-gray-600 hover:text-black">View my orders instead</button>
      </section>
    </div>
  );
}

function PaymentLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-7 shadow-xl shadow-slate-300/40 backdrop-blur sm:p-9">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <LockKeyhole className="h-3.5 w-3.5" /> Secure checkout
          </div>
        </div>
        <div className="mt-8">
          <div className="mb-4 h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-slate-900" /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Preparing secure payment</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">We’re connecting you safely to our payment provider. This only takes a moment.</p>
        </div>
        <div className="mt-7 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex items-center gap-3 text-sm text-slate-700"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-3.5 w-3.5" /></span>Order confirmed</div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-900"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />Loading payment options</div>
          <div className="flex items-center gap-3 text-sm text-slate-400"><span className="h-5 w-5 rounded-full border-2 border-slate-200" />Ready to pay</div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Your payment details are encrypted and never stored by us.</p>
      </section>
    </div>
  );
}

function PaymentError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-red-600">Payment unavailable</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {onRetry && <button onClick={onRetry} className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">Try payment again</button>}
          <button onClick={() => navigate("/customer-order")} className="rounded-xl border px-5 py-3 text-sm font-semibold text-gray-700">View my orders</button>
        </div>
      </section>
    </div>
  );
}
