import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useResendVerification } from "./auth.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, Send, Clock } from "lucide-react";

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
    <>
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { 
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
      `}</style>

      <div className="min-h-screen w-full flex items-center justify-center bg-[#ECEFF4] dark:bg-[#0B0F19] p-4 sm:p-6 lg:p-10 font-sans antialiased text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-8 text-center space-y-6 animate-fade-up">
          
          {/* LOGO */}
          <div className="flex justify-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src="/ChatGPT%20Image%20Sep%205,%202026,%2012_33_26%20AM.png"
                alt="NextG Logo"
                className="size-8 rounded-lg object-cover"
              />
              <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                Next<span className="text-[#F97316]">G.</span>
              </span>
            </Link>
          </div>

          {/* ICON BADGE */}
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 flex items-center justify-center text-[#F97316] shadow-sm">
              <Mail className="size-8" />
            </div>
          </div>

          {/* TEXT HEADER */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Please verify your email
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              {initialEmail ? (
                <>
                  We sent a confirmation link to{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200 break-all">{initialEmail}</span>.
                  Click it to activate your account before logging in.
                </>
              ) : (
                "A verification link has been sent to your inbox. Click the link inside to activate your account before logging in."
              )}
            </p>
          </div>

          {/* SUCCESS MESSAGE */}
          {resendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-left">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {resendError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 text-left">
              <AlertCircle className="size-4 shrink-0" />
              <span>{resendError}</span>
            </div>
          )}

          {/* RESEND FORM */}
          <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
            <div className="space-y-1">
              <label htmlFor="verify-email" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Email address for verification
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
                  className="h-10 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-900 dark:text-slate-100 focus:border-[#F97316] focus:ring-[#F97316] text-xs pl-10 pr-3.5 rounded-xl shadow-2xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={resendVerification.isPending || resendCooldown > 0}
              className="w-full h-10 rounded-xl bg-[#F97316] hover:bg-[#ea660c] text-white text-xs font-bold shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                  <span>Send verification again</span>
                </>
              )}
            </Button>
          </form>

          {/* HELPER TEXT */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Didn't receive an email? Check your spam/junk folder or click "Send verification again".
          </p>

          {/* BACK TO LOGIN */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#F97316] dark:hover:text-[#F97316] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
