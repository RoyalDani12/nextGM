"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";

import { registerSchema, type RegisterFormValues } from "./auth.schema";
import { useRegister } from "./auth.hooks";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  UserPlus
} from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const registerUser = useRegister();
  const onSubmit = (values: RegisterFormValues) => registerUser.mutate(values);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(25px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { 
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
          opacity: 0; 
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .diagonal-split-clip {
          clip-path: polygon(0 0, 100% 0, calc(100% - 120px) 100%, 0 100%);
        }
        @media (max-width: 1024px) {
          .diagonal-split-clip { clip-path: none; }
        }
      `}</style>

      <div className="min-h-screen w-full flex items-center justify-center bg-[#ECEFF4] dark:bg-[#0B0F19] p-4 sm:p-6 lg:p-10 font-sans antialiased text-slate-900 dark:text-slate-100">
        
        <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden flex flex-col lg:flex-row min-h-[640px] animate-fade-up">
          
          {/* MAIN FORM SECTION (CENTERED CONTENT) */}
          <div className="w-full lg:w-7/12 bg-white dark:bg-zinc-900 p-6 sm:p-10 lg:p-12 flex flex-col justify-between items-center text-center order-1 lg:order-2">
            
            {/* MOBILE HEADER */}
            <div className="w-full flex lg:hidden items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 animate-fade-up">
              <Link to="/" className="inline-flex items-center gap-2">
                <img
                  src="/ChatGPT%20Image%20Sep%205,%202026,%2012_33_26%20AM.png"
                  alt="NextG Logo"
                  className="size-7 rounded-lg object-cover"
                />
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                  Next<span className="text-[#F97316]">G.</span>
                </span>
              </Link>

              {/* OUTLINED PILL BUTTON MATCHING DESIGN */}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
              >
                Sign in
                <ArrowRight className="size-3.5 text-slate-600 dark:text-slate-300" />
              </Link>
            </div>

            {/* DESKTOP TOP BAR */}
            <div className="w-full hidden lg:flex justify-end items-center gap-3 animate-fade-up delay-100">
              <span className="text-xs text-slate-500 dark:text-slate-400">Already have an account?</span>
              
              {/* OUTLINED PILL BUTTON MATCHING DESIGN */}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
              >
                Sign in
                <ArrowRight className="size-3.5 text-slate-600 dark:text-slate-300" />
              </Link>
            </div>

            {/* CENTERED FORM CONTAINER */}
            <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6 flex flex-col items-center justify-center animate-fade-up delay-100">
              
              {/* CENTERED HEADER */}
              <div className="space-y-2 text-center flex flex-col items-center">
                <div className="size-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <UserPlus className="size-6 text-[#F97316]" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Create merchant account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Initialize your multi-currency NextG storefront today.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 text-left">
                
                {/* NAME */}
                <div className="space-y-1">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      className="h-11 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-900 dark:text-slate-100 focus:border-[#F97316] focus:ring-[#F97316] transition-all placeholder:text-slate-400 rounded-xl text-xs pl-10 pr-3.5 shadow-2xs"
                      placeholder="Full Name"
                      autoComplete="name"
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-rose-500 font-medium pl-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* EMAIL */}
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      className="h-11 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-900 dark:text-slate-100 focus:border-[#F97316] focus:ring-[#F97316] transition-all placeholder:text-slate-400 rounded-xl text-xs pl-10 pr-3.5 shadow-2xs"
                      placeholder="Work Email (you@company.com)"
                      autoComplete="email"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-500 font-medium pl-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* PASSWORD & CONFIRM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="h-11 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-900 dark:text-slate-100 focus:border-[#F97316] focus:ring-[#F97316] transition-all placeholder:text-slate-400 rounded-xl text-xs pl-10 pr-9 shadow-2xs"
                        placeholder="Password"
                        autoComplete="new-password"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-500 font-medium pl-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="h-11 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-900 dark:text-slate-100 focus:border-[#F97316] focus:ring-[#F97316] transition-all placeholder:text-slate-400 rounded-xl text-xs pl-10 pr-9 shadow-2xs"
                        placeholder="Confirm"
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-rose-500 font-medium pl-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* ERROR ALERT */}
                {registerUser.isError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-2">
                    <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      {(registerUser.error as any)?.response?.data?.message ??
                        "Registration failed. Please try again."}
                    </p>
                  </div>
                )}

                {/* SUBMIT BUTTON WITH ARROW ICON */}
                <Button
                  type="submit"
                  className="w-full h-11 text-xs font-bold bg-[#F97316] hover:bg-[#ea660c] text-white rounded-full shadow-md transition-all border-0 mt-2 cursor-pointer active:scale-[0.99] inline-flex items-center justify-center gap-2"
                  disabled={registerUser.isPending}
                >
                  {registerUser.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="size-4 text-white" />
                      Initializing account...
                    </span>
                  ) : (
                    <>
                      <span>Create Merchant Account</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div />
          </div>

          {/* BRANDING & ILLUSTRATION PANEL (DESKTOP ONLY) */}
          <div className="hidden lg:flex lg:w-5/12 bg-[#F8FAFC] dark:bg-zinc-900/60 p-8 lg:p-10 flex-col justify-between border-t lg:border-t-0 lg:border-r border-slate-200/60 dark:border-zinc-800 diagonal-split-clip order-2 lg:order-1">
            
            {/* BRAND LOGO */}
            <div className="animate-fade-up delay-100">
              <Link
                to="/"
                className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity"
                aria-label="Back to home page"
              >
                <img
                  src="/ChatGPT%20Image%20Sep%205,%202026,%2012_33_26%20AM.png"
                  alt="NextG Logo"
                  className="size-8 rounded-xl object-cover shadow-2xs"
                />
                <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">
                  Next<span className="text-[#F97316]">G.</span>
                </span>
              </Link>
            </div>

            {/* FULL IMAGE CONTAINER */}
            <div className="my-6 p-3 bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700/50 shadow-xs flex items-center justify-center overflow-hidden animate-fade-up delay-100">
              <img
                src="/loginImage.png"
                alt="NextG Merchant Onboarding Visual"
                className="w-full h-auto max-h-52 object-contain rounded-xl"
              />
            </div>

            {/* BENEFITS */}
            <div className="space-y-3 text-left animate-fade-up delay-200">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Merchant Onboarding
              </h3>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Multi-currency instant checkout routing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Automated cross-border tax calculation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Enterprise webhook management & real-time logs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Zero-configuration storefront setup</span>
                </li>
              </ul>
            </div>

            {/* FOOTER */}
            <div className="pt-6 text-[11px] text-slate-400 dark:text-slate-500 animate-fade-up delay-200">
              © {new Date().getFullYear()} NextG Inc. All rights reserved.
            </div>
          </div>

        </div>
      </div>
    </>
  );
}