import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { forgotPasswordSchema, type ForgetPasswordFormValue } from "./auth.schema";
import { useForgotPassword } from "./auth.hooks";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export const ForgetPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const forgot = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgetPasswordFormValue>({ resolver: zodResolver(forgotPasswordSchema) });
  return (
    <AuthLayout eyebrow="Account recovery" title="Reset your password" description="Enter your email and we’ll send a secure link to get you back into your workspace." bullets={["Single-use recovery links", "No account details revealed", "Encrypted account protection"]} footer={<>Remembered it? <Link to="/login" className="font-bold text-emerald-600 hover:underline">Back to sign in</Link></>}>
      {submitted || forgot.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800"><p className="font-bold">Check your inbox</p><p className="mt-1">If an account exists for that email, recovery instructions are on the way.</p><Link to="/login" className="mt-4 inline-block font-bold underline">Return to sign in</Link></div> : <form onSubmit={handleSubmit((values) => forgot.mutate(values, { onSuccess: () => setSubmitted(true) }))} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />{errors.email && <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>}</div>
        {forgot.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs text-rose-700">Unable to send instructions. Please try again.</p>}
        <Button disabled={forgot.isPending} className="h-12 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800">{forgot.isPending ? <><Spinner className="mr-2 size-4" /> Sending…</> : "Send recovery link"}</Button>
      </form>}
    </AuthLayout>
  );
};
