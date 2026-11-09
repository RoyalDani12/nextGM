import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useResendVerification } from "./auth.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Clock,
  ExternalLink,
  Shield,
  HelpCircle,
  Inbox,
} from "lucide-react";

export default function VerifyEmailNotice() {
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | undefined)?.email || "";

  const [email, setEmail] = useState(initialEmail);
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

  const handleResend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setResendError("Please enter your email address to receive a verification link.");
      return;
    }
    setResendError(null);
    setResendSuccess(null);

    resendVerification.mutate(targetEmail, {
      onSuccess: (data) => {
        setResendSuccess(
          data?.message || "Verification link sent! Please check your inbox and spam folder."
        );
        setResendCooldown(60);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          "Unable to send verification email. Please try again later.";
        setResendError(msg);
      },
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[520px] rounded-full bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent blur-3xl dark:from-orange-600/10 dark:via-orange-400/5" />
        <div className="absolute -bottom-32 right-1/4 size-[400px] rounded-full bg-gradient-to-tr from-blue-400/10 via-indigo-300/5 to-transparent blur-3xl dark:from-blue-600/5" />
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
            <Shield className="size-3 text-orange-500" />
            <span>Account Activation Required</span>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 transition-all text-center space-y-5">
          {/* ICON BADGE */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-md animate-pulse" />
              <div className="relative size-16 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-500 shadow-sm">
                <Mail className="size-8" />
              </div>
            </div>
          </div>

          {/* TEXT HEADER */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Check your inbox
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              {initialEmail ? (
                <>
                  We sent an official confirmation link to{" "}
                  <strong className="font-bold text-slate-800 dark:text-slate-200 break-all">{initialEmail}</strong>.
                  Please click the link inside to activate your account.
                </>
              ) : (
                "We sent a confirmation link to your registered email address. Click the link to complete account setup and sign in."
              )}
            </p>
          </div>

          {/* QUICK WEBMAIL SHORTCUTS */}
          <div className="pt-1 flex items-center justify-center gap-2">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
            >
              <Inbox className="size-3.5 text-orange-500" />
              <span>Open Gmail</span>
              <ExternalLink className="size-3 text-slate-400" />
            </a>
            <a
              href="https://outlook.live.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
            >
              <Inbox className="size-3.5 text-blue-500" />
              <span>Open Outlook</span>
              <ExternalLink className="size-3 text-slate-400" />
            </a>
          </div>

          {/* SUCCESS MESSAGE */}
          {resendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 text-left">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {resendError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs font-medium text-rose-700 dark:text-rose-300 text-left">
              <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{resendError}</span>
            </div>
          )}

          {/* RESEND FORM */}
          <form onSubmit={handleResend} className="space-y-3 pt-1 text-left">
            <div className="space-y-1">
              <label htmlFor="verify-email" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Resend to this email address:
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-xs pl-10 pr-3.5 rounded-xl shadow-2xs focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={resendVerification.isPending || resendCooldown > 0}
              className="w-full h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {resendVerification.isPending ? (
                <>
                  <Spinner className="size-3.5 text-white" />
                  <span>Sending verification link...</span>
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="size-3.5 text-white" />
                  <span>Send verification again in {resendCooldown}s</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5 text-white" />
                  <span>Send verification link again</span>
                </>
              )}
            </Button>
          </form>

          {/* HELPFUL TIPS */}
          <div className="text-left text-[11px] text-slate-500 dark:text-slate-400 space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="size-3.5 text-orange-500" />
              <span>Can't find the email?</span>
            </p>
            <p className="leading-relaxed">
              Check your spam or junk folder. Emails usually arrive within 60 seconds. If needed, request another link above.
            </p>
          </div>

          {/* BACK TO LOGIN */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to sign in</span>
            </Link>
            <Link
              to="/support"
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Need help?
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Protected by NextG Cloud Security · All rights reserved © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
