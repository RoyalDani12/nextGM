import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { loginSchema, type LoginFormValues } from "./auth.schema";
import { useLogin } from "./auth.hooks";
import { isDeactivatedResponse } from "./auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });
    const login = useLogin();

    const onSubmit = (values: LoginFormValues) => login.mutate(values);

    const deactivated = login.data && isDeactivatedResponse(login.data);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nexions</h1>
                    <p className="mt-2 text-sm text-slate-500">Sign in to your account</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    {deactivated ? (
                        <div className="text-sm text-slate-700">
                            <p className="mb-2">Your account is deactivated.</p>
                            <p className="text-slate-500">Reactivation isn't available here yet — contact support to restore access.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
                                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                            </div>

                            {login.isError && (
                                <p className="text-sm text-red-600">
                                    {(login.error as any)?.response?.data?.message ?? "Something went wrong. Try again."}
                                </p>
                            )}

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={login.isPending}>
                                {login.isPending ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>
                    )}
                </div>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}