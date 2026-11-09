import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useVerifyEmail, useResendVerification } from "./auth.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckCircle2,
  XCircle,
  Mail,
  Send,
  Clock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Lock,
  RefreshCw,
} from "lucide-react";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const { status, data, error, refetch, isFetching } = useVerifyEmail(token);

  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const resendVerification = useResendVerification();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setResendError("Please enter your account email address.");
      return;
    }
    setResendError(null);
    setResendSuccess(null);

    resendVerification.mutate(targetEmail, {
      onSuccess: (res) => {
        setResendSuccess(res?.message || "A new verification link has been sent to your inbox.");
        setResendCooldown(60);
      },
      onError: (err: any) => {
        setResendError(
          err?.response?.data?.message ||
            "Unable to resend verification email right now. Please try again shortly."
        );
      },
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[520px] rounded-full bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent blur-3xl dark:from-orange-600/10 dark:via-orange-400/5" />
        <div className="absolute -bottom-32 right-1/4 size-[400px] rounded-full bg-gradient-to-tr from-emerald-400/10 via-teal-300/5 to-transparent blur-3xl dark:from-emerald-600/5" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* BRAND HEADER */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link
            to="/"
            className="group inline-flex items-center gap-2.5 transition-transform hover:scale-105 duration-200"
          >
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 font-black text-lg">
              N
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
              Next<span className="text-orange-500">G.</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Lock className="size-3 text-orange-500" />
            <span>Secure Account Verification</span>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 transition-all">
          
          {/* STATE 1: PENDING / VERIFYING */}
          {status === "pending" && (
            <div className="flex flex-col items-center text-center space-y-5 py-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-md animate-pulse" />
                <div className="relative size-16 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-500">
                  <Spinner className="size-8 text-orange-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Verifying your account
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Please hold on a moment while we validate your security token and activate your profile.
                </p>
              </div>

              {/* Progress Stepper */}
              <div className="w-full rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 p-4 space-y-2.5 text-left text-xs">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Security token parsed</span>
                </div>
                <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400 font-semibold animate-pulse">
                  <Spinner className="size-4 shrink-0 text-orange-500" />
                  <span>Verifying digital signature...</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                  <span className="size-4 rounded-full border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-[10px]">3</span>
                  <span>Activating account privileges</span>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS */}
          {status === "success" && (
            <div className="flex flex-col items-center text-center space-y-5 py-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-lg animate-pulse" />
                <div className="relative size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-9" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1">
                  <Sparkles className="size-3.5" />
                  <span>Account Activated</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Email verified successfully!
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {(data as any)?.message ||
                    "Your identity has been authenticated. You now have full access to shop, track orders, or manage your storefront."}
                </p>
              </div>

              {/* Unlocked Capabilities Summary */}
              <div className="w-full rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 text-left text-xs space-y-2">
                <p className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>What's unlocked for you:</span>
                </p>
                <ul className="text-[11px] text-emerald-800 dark:text-emerald-300/90 space-y-1 pl-5 list-disc">
                  <li>Full marketplace checkout and payment capabilities</li>
                  <li>Real-time order tracking and return claims</li>
                  <li>Seller storefront and analytics access</li>
                </ul>
              </div>

              <div className="w-full space-y-2 pt-2">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign in to your account</span>
                  <ArrowRight className="size-4" />
                </Button>

                <Link
                  to="/"
                  className="inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors pt-1"
                >
                  Return to home page
                </Link>
              </div>
            </div>
          )}

          {/* STATE 3: ERROR / EXPIRED */}
          {status === "error" && (
            <div className="flex flex-col items-center text-center space-y-5 py-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-rose-400/20 blur-md" />
                <div className="relative size-16 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <XCircle className="size-9" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Verification Link Expired or Invalid
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {(error as any)?.response?.data?.message ||
                    "This verification link has either expired after 24 hours or has already been used to activate your account."}
                </p>
              </div>

              {/* Retry Token Check (if token was present) */}
              {token && (
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                >
                  <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                  <span>Retry verification check</span>
                </button>
              )}

              {/* RESEND FORM CARD */}
              <div className="w-full rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 p-4 sm:p-5 text-left space-y-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="size-3.5 text-orange-500" />
                    <span>Request a fresh verification link</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Enter the email address registered with your NextG account to receive an instant new activation link.
                  </p>
                </div>

                {resendSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                {resendError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                    <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{resendError}</span>
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-2.5 pt-1">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your account email (e.g. alex@example.com)"
                      required
                      className="h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-xs pl-10 pr-3.5 rounded-xl shadow-2xs focus-visible:ring-orange-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resendVerification.isPending || resendCooldown > 0}
                    className="w-full h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {resendVerification.isPending ? (
                      <>
                        <Spinner className="size-3.5 text-white" />
                        <span>Sending new link...</span>
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="size-3.5 text-white" />
                        <span>Send again in {resendCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5 text-white" />
                        <span>Send verification email</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* HELPFUL TIPS */}
              <div className="w-full text-left text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <HelpCircle className="size-3.5 text-amber-600" />
                  <span>Helpful checklist:</span>
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-800/90 dark:text-amber-300/80">
                  <li>Check your spam, junk, or promotions folder</li>
                  <li>Ensure you clicked the link in the most recent email</li>
                  <li>Already activated? Try signing in directly</li>
                </ul>
              </div>

              {/* ACTION BUTTONS */}
              <div className="w-full pt-1 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex-1 h-10 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center transition-colors"
                >
                  Go to Sign In
                </Link>
                <Link
                  to="/support"
                  className="w-full sm:w-auto flex-1 h-10 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Protected by NextG Cloud Security · All rights reserved © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
