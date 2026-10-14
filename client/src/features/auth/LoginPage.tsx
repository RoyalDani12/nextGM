
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginSchema, type LoginFormValues } from "./auth.schema";
import { useLogin } from "./auth.hooks";
import { useMergeCart } from "../cart/cart.hook";
import { isDeactivatedResponse } from "./auth.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  ArrowRight
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const requestedRedirect = searchParams.get("redirect");
  const googleError = searchParams.get("googleError");

  const redirectTo =
    requestedRedirect &&
    requestedRedirect.startsWith("/") &&
    !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const login = useLogin();
  const mergeCart = useMergeCart();

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onSuccess: async () => {
        try {
          await mergeCart.mutateAsync();
          navigate(redirectTo, { replace: true });
        } catch (error) {
          console.error("Failed to merge guest cart:", error);
          navigate("/cart", {
            replace: true,
            state: { cartMergeFailed: true },
          });
        }
      },
    });
  };

  const deactivated = login.data && isDeactivatedResponse(login.data);

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
          
          {/* MAIN LOGIN FORM (CENTERED CONTENT & FIRST ON MOBILE) */}
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

              {/* OUTLINED PILL BUTTON */}
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
              >
                Sign up
                <ArrowRight className="size-3.5 text-slate-600 dark:text-slate-300" />
              </Link>
            </div>

            {/* DESKTOP TOP ACTION BAR */}
            <div className="w-full hidden lg:flex justify-end items-center gap-3 animate-fade-up delay-100">
              <span className="text-xs text-slate-500 dark:text-slate-400">Don't have an account?</span>
              
              {/* OUTLINED PILL BUTTON */}
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
              >
                Sign up
                <ArrowRight className="size-3.5 text-slate-600 dark:text-slate-300" />
              </Link>
            </div>

            {/* CENTERED FORM CONTAINER */}
            <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6 flex flex-col items-center justify-center animate-fade-up delay-200">
              
              {/* CENTERED HEADER */}
              <div className="space-y-2 text-center flex flex-col items-center">
                <div className="size-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <User className="size-6 text-[#F97316]" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Login to your supplier panel
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Welcome back, you've been missed!
                  </p>
                </div>
              </div>

              {/* DEACTIVATED ACCOUNT WARNING */}
              {deactivated ? (
                <div className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <h3>Account Deactivated</h3>
                  </div>
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 pl-6">
                    Please contact support to restore access to your seller panel.
                  </p>
                </div>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => window.location.assign(`${import.meta.env.VITE_API_URL}/auth/google`)} className="w-full h-11 rounded-full border-slate-200 dark:border-zinc-700 text-xs font-bold">
                    <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z"/><path fill="#34A853" d="M12 21.75c2.63 0 4.83-.87 6.44-2.36l-3.14-2.52c-.87.58-1.99.92-3.3.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.6A9.73 9.73 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.54 13.76A5.86 5.86 0 0 1 6.24 12c0-.61.11-1.2.3-1.76v-2.6H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.6Z"/><path fill="#EA4335" d="M12 6.21c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.3 14.62 2.25 12 2.25A9.73 9.73 0 0 0 3.3 7.64l3.24 2.6C7.31 7.93 9.46 6.21 12 6.21Z"/></svg>
                    Continue with Google
                  </Button>
                  <div className="flex w-full items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />or continue with email<span className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" /></div>
                <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 text-left">
                  
                  {/* EMAIL FIELD */}
                  <div className="space-y-1">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        className="h-11 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-900 dark:text-slate-100 focus:border-[#F97316] focus:ring-[#F97316] transition-all placeholder:text-slate-400 rounded-xl text-xs pl-10 pr-3.5 shadow-2xs"
                        placeholder="Email id or Mobile number"
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

                  {/* PASSWORD FIELD */}
                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="h-11 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-900 dark:text-slate-100 focus:border-[#F97316] focus:ring-[#F97316] transition-all placeholder:text-slate-400 rounded-xl text-xs pl-10 pr-11 shadow-2xs"
                        placeholder="Enter Password"
                        autoComplete="current-password"
                        {...register("password")}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-500 font-medium pl-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* REMEMBER ME & FORGOT PASSWORD */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="size-3.5 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                      />
                      <span>Remember Me</span>
                    </label>

                    <Link
                      to="/forgot-password"
                      className="font-semibold text-slate-600 dark:text-slate-400 hover:text-[#F97316] transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* ERROR ALERTS */}
                  {login.isError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                      <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-semibold">
                        {(login.error as any)?.response?.data?.message ??
                          "Invalid email or password."}
                      </p>
                    </div>
                  )}

                  {mergeCart.isError && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-semibold">
                        We couldn't merge your previous cart. Please review your cart before continuing.
                      </p>
                    </div>
                  )}

                  {googleError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                      <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-semibold">{googleError}</p>
                    </div>
                  )}

                  {/* SUBMIT BUTTON */}
                  <Button
                    type="submit"
                    className="w-full h-11 text-xs font-bold bg-[#F97316] hover:bg-[#ea660c] text-white rounded-full shadow-md transition-all border-0 mt-2 cursor-pointer active:scale-[0.99] inline-flex items-center justify-center gap-2"
                    disabled={login.isPending || mergeCart.isPending}
                  >
                    {login.isPending || mergeCart.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner className="size-4 text-white" />
                        {login.isPending ? "Logging in..." : "Merging cart..."}
                      </span>
                    ) : (
                      <>
                        <span>Log In</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form></>
              )}
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
                alt="NextG Marketplace Login Visual"
                className="w-full h-auto max-h-52 object-contain rounded-xl"
              />
            </div>

            {/* WHY NEXTG BENEFIT LIST */}
            <div className="space-y-3 text-left animate-fade-up delay-200">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Why NextG
              </h3>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Sell directly to active customers with zero fee markup</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Become a verified seller & grow your business</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>700+ physical product categories available</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Automated payouts & real-time inventory management</span>
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
