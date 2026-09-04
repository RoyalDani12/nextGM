import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useResetPassword } from "./auth.hooks";
import { type resetPasswordFormValues, resetPasswordSchema } from "./auth.schema";

export const ResetPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [params] = useSearchParams();
  const token = params.get("token");
  const reset = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<resetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });
  const submit = (values: resetPasswordFormValues) => { if (token) reset.mutate({ token, ...values }, { onSuccess: () => setSubmitted(true) }); };
  return (
    <AuthLayout eyebrow="Secure credential update" title="Choose a new password" description="Use a strong, unique password to protect your Nexions workspace." bullets={["Single-use secure token", "Password never exposed to support", "Immediate account protection"]} footer={<>Remembered your password? <Link to="/login" className="font-bold text-emerald-600 hover:underline">Sign in</Link></>}>
      {submitted || reset.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800"><p className="font-bold">Password updated</p><p className="mt-1">You can now sign in with your new password.</p><Link to="/login" className="mt-4 inline-block font-bold underline">Return to sign in</Link></div> : <form onSubmit={handleSubmit(submit)} className="space-y-5">
        {!token && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">This reset link is missing or invalid. Request a new one.</p>}
        <div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" placeholder="Create password" {...register("newPassword")} />{errors.newPassword && <p className="text-xs text-rose-600">{errors.newPassword.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat password" {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-xs text-rose-600">{errors.confirmPassword.message}</p>}</div>
        {reset.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs text-rose-700">This link may have expired. Request a new reset link.</p>}
        <Button type="submit" disabled={!token || reset.isPending} className="h-12 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800">{reset.isPending ? <><Spinner className="mr-2 size-4" /> Updating…</> : "Update password"}</Button>
      </form>}
    </AuthLayout>
  );
};
