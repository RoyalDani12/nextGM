import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { registerSchema, type RegisterFormValues } from "./auth.schema";
import { useRegister } from "./auth.hooks";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterPage() {
  const registerUser = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const error = registerUser.error instanceof Error ? registerUser.error.message : "We could not create your account.";
  return (
    <AuthLayout eyebrow="Merchant onboarding" title="Build your next chapter" description="Create an account and launch a polished storefront in minutes." bullets={["No setup fees to get started", "A storefront that scales with you", "Human support when you need it"]} footer={<>Already have an account? <Link className="font-bold text-emerald-600 hover:underline" to="/login">Sign in</Link></>}>
      <form onSubmit={handleSubmit((values) => registerUser.mutate(values))} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" autoComplete="name" placeholder="Alex Morgan" {...register("name")} />{errors.name && <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />{errors.email && <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" placeholder="Create password" {...register("password")} />{errors.password && <p className="text-xs font-medium text-rose-600">{errors.password.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat password" {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-xs font-medium text-rose-600">{errors.confirmPassword.message}</p>}</div>
        </div>
        {registerUser.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-700">{error}</p>}
        <Button type="submit" disabled={registerUser.isPending} className="h-12 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800">{registerUser.isPending ? <><Spinner className="mr-2 size-4" /> Creating account…</> : "Create account"}</Button>
        <p className="text-center text-[11px] leading-5 text-slate-500">By continuing, you agree to our terms and privacy policy.</p>
      </form>
    </AuthLayout>
  );
}
