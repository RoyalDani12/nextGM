import { MailCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function VerifyEmailNotice() {
  return <AuthLayout eyebrow="One last step" title="Check your inbox" description="We sent a verification link to your email. Confirm it to activate your Nexions account." bullets={["Verified accounts build trust", "Secure, time-limited link", "You can sign in right after verification"]} footer={<>Already verified? <Link to="/login" className="font-bold text-emerald-600 hover:underline">Sign in</Link></>}>
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><MailCheck className="size-7" /></div><p className="text-sm leading-6 text-slate-600">Open the email from Nexions and follow the link. If you don’t see it, check your spam folder.</p><Link to="/login" className="mt-6 inline-flex font-bold text-emerald-600 hover:underline">Back to sign in</Link></div>
  </AuthLayout>;
}
