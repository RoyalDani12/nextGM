import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { loginSchema, type LoginFormValues } from "./auth.schema";
import { useLogin } from "./auth.hooks";
import { isDeactivatedResponse } from "./auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<LoginFormValues>({
      resolver: zodResolver(loginSchema),
   });

   const login = useLogin();
   const onSubmit = (values: LoginFormValues) => login.mutate(values);
   const deactivated = login.data && isDeactivatedResponse(login.data);

   return (
      <>
         <style>{`
            @keyframes fadeUp {
               0% { opacity: 0; transform: translateY(25px); }
               100% { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-up { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
            .delay-100 { animation-delay: 100ms; }
            .delay-200 { animation-delay: 200ms; }
            .diagonal-split-clip {
               clip-path: polygon(0 0, 100% 0, calc(100% - 120px) 100%, 0 100%);
            }
            @media (max-width: 1024px) {
               .diagonal-split-clip { clip-path: none; }
            }
         `}</style>

         <div className="min-h-screen flex flex-col bg-white text-slate-900 relative overflow-hidden">
            
            {/* Navigation Header with Home Logo Link */}
            <header className="relative z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
               <Link 
                  to="/" 
                  className="flex items-center gap-2 text-slate-900 hover:opacity-80 transition-opacity"
                  aria-label="Back to home"
               >
                  {/* Brand Mark Icon / Logo */}
                  <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                     <span className="text-emerald-400 font-extrabold">/</span>
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                     Brand<span className="text-emerald-600">Logo</span>
                  </span>
               </Link>

               <Link 
                  to="/" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
               >
                  <ArrowLeft className="size-3.5" />
                  Back to home
               </Link>
            </header>

            {/* Main Content Layout with True Diagonal Split ( / ) */}
            <main className="flex-1 flex flex-col lg:flex-row relative z-10 w-full overflow-hidden">
               
               {/* Left Section: Black Background with Sky & Green Accents (Diagonal Cut) */}
               <div className="hidden lg:flex w-[55%] bg-black text-white p-16 xl:p-24 flex-col justify-between relative overflow-hidden animate-fade-up delay-100 diagonal-split-clip">
                  
                  {/* Glowing Ambiance Lights (Sky & Green) */}
                  <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-10 right-20 w-[450px] h-[450px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />

                  <div className="relative z-10 space-y-6 max-w-lg">
                     <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                        Global Commerce Platform
                     </div>
                     <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                        Infrastructure for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                           Borderlessness.
                        </span>
                     </h1>
                     <p className="text-slate-400 text-lg leading-relaxed">
                        Securely orchestrate multi-currency checkouts, real-time compliance routing, and automated payouts from a single unified engine.
                     </p>
                  </div>

                  <div className="relative z-10 pt-10 border-t border-slate-800/80 flex items-center justify-between text-sm text-slate-400 max-w-lg">
                     <div>
                        <p className="font-bold text-white text-base">99.99% Uptime</p>
                        <p className="text-xs text-slate-500 mt-0.5">SLA Guaranteed</p>
                     </div>
                     <div className="h-8 w-[1px] bg-slate-800" />
                     <div>
                        <p className="font-bold text-white text-base">135+ Currencies</p>
                        <p className="text-xs text-slate-500 mt-0.5">Instant Settlement</p>
                     </div>
                  </div>
               </div>

               {/* Right Section: Clean White Workspace & Form */}
               <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-12 xl:p-20 bg-white animate-fade-up delay-200">
                  <div className="w-full max-w-md space-y-8">
                     
                     <div className="text-left space-y-2">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
                        <p className="text-sm text-slate-500">Sign in to access your merchant operations dashboard.</p>
                     </div>

                     {deactivated ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                           <h3 className="font-semibold text-red-600 mb-1">Account Deactivated</h3>
                           <p className="text-sm text-red-600/80">Please contact enterprise support to restore access.</p>
                        </div>
                     ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                           <div className="space-y-2">
                              <Label htmlFor="email" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Work Email</Label>
                              <Input
                                 id="email"
                                 type="email"
                                 className="h-12 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                                 placeholder="name@company.com"
                                 autoComplete="email"
                                 {...register("email")}
                              />
                              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                           </div>

                           <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                 <Label htmlFor="password" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Password</Label>
                                 <Link to="/forgot-password" className="text-xs font-semibold text-sky-600 hover:text-sky-500 transition-colors">
                                    Forgot password?
                                 </Link>
                              </div>
                              <Input
                                 id="password"
                                 type="password"
                                 className="h-12 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                                 placeholder="••••••••"
                                 autoComplete="current-password"
                                 {...register("password")}
                              />
                              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                           </div>

                           {login.isError && (
                              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                 <p className="text-xs text-red-600 text-center font-medium">
                                    {(login.error as any)?.response?.data?.message ?? "Invalid email or password."}
                                 </p>
                              </div>
                           )}

                           <Button
                              type="submit"
                              className="w-full h-12 text-base font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all border-0 mt-2"
                              disabled={login.isPending}
                           >
                              {login.isPending ? (
                                 <span className="flex items-center gap-2">
                                    <Spinner className="size-5 text-white" /> Authenticating...
                                 </span>
                              ) : "Sign in to Dashboard"}
                           </Button>
                        </form>
                     )}

                     <p className="text-center text-sm text-slate-500 pt-4">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                           Create merchant account
                        </Link>
                     </p>
                  </div>
               </div>

            </main>
         </div>
      </>
   );
}