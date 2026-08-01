import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { registerSchema, type RegisterFormValues } from "./auth.schema";
import { useRegister } from "./auth.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });
    const registerUser = useRegister();

    const onSubmit = (values: RegisterFormValues) => registerUser.mutate(values);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nexions</h1>
                    <p className="mt-2 text-sm text-slate-500">Create your account</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Full name</Label>
                            <Input id="name" autoComplete="name" {...register("name")} />
                            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" autoComplete="email" {...register("email")} />
                            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirm password</Label>
                            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
                            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
                        </div>

                        {registerUser.isError && (
                            <p className="text-sm text-red-600">
                                {(registerUser.error as any)?.response?.data?.message ?? "Something went wrong. Try again."}
                            </p>
                        )}

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={registerUser.isPending}>
                            {registerUser.isPending ? "Creating account..." : "Create account"}
                        </Button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}