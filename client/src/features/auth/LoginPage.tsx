import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "react-router-dom";
import { loginSchema, type LoginFormValues } from "./auth.schema";
import { useLogin } from "./auth.hooks";
import { isDeactivatedResponse } from "./auth.types";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const location = useLocation();
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const onSubmit = (values: LoginFormValues) => login.mutate(values);
  const deactivated = login.data && isDeactivatedResponse(login.data);
  const message = login.error instanceof Error ? login.error.message : "Unable to sign in. Check your credentials and try again.";
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  return (
    <AuthLayout eyebrow="Secure workspace" title="Welcome back" description="Sign in to manage your storefront and keep every order moving." bullets={["Protected merchant workspace", "Real-time order visibility", "Built-in buyer trust tools"]} footer={<>New to Nexions? <Link className="font-bold text-emerald-600 hover:underline" to="/register">Create an account</Link></>}>
      {deactivated ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <p className="font-bold">Account deactivated</p><p className="mt-1">Please contact support to restore access.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />{errors.email && <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>}</div>
          <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs font-bold text-emerald-600 hover:underline">Forgot password?</Link></div><Input id="password" type="password" autoComplete="current-password" placeholder="Your password" {...register("password")} />{errors.password && <p className="text-xs font-medium text-rose-600">{errors.password.message}</p>}</div>
          {login.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-700">{message}</p>}
          <Button type="submit" disabled={login.isPending} className="h-12 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800">{login.isPending ? <><Spinner className="mr-2 size-4" /> Signing in…</> : "Sign in"} </Button>
          {from && <p className="text-center text-xs text-slate-500">You’ll return to your requested page after signing in.</p>}
        </form>
      )}
    </AuthLayout>
  );
}
