import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "./auth.hooks";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const result = useVerifyEmail(token);
  const success = result.status === "success";
  return <AuthLayout eyebrow="Email verification" title={result.status === "pending" ? "Verifying your email" : success ? "You’re all set" : "Verification failed"} description={result.status === "pending" ? "Please wait while we confirm your secure link." : success ? "Your account is ready to use." : "This link may be expired or invalid. Request a new verification email if needed."} bullets={["Secure account activation", "No extra setup required", "Trusted marketplace access"]} footer={<Link to="/login" className="font-bold text-emerald-600 hover:underline">Back to sign in</Link>}>
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {result.status === "pending" && <Loader2 className="mx-auto size-10 animate-spin text-emerald-600" />}
      {success && <CheckCircle2 className="mx-auto size-10 text-emerald-600" />}
      {result.status === "error" && <XCircle className="mx-auto size-10 text-rose-600" />}
      <p className="mt-4 text-sm text-slate-600">{success ? "Your email has been successfully verified." : result.status === "error" ? "Please request a fresh link and try again." : "Verifying your account…"}</p>
      {result.status !== "pending" && <Button render={<Link to="/login" />} className="mt-6 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800">{success ? "Continue to sign in" : "Back to sign in"}</Button>}
    </div>
  </AuthLayout>;
}
