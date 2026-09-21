import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { PublicNavbar } from "@/components/layout/marketplace/PublicNavbar";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { forgotPasswordSchema, type ForgetPasswordFormValue } from "./auth.schema";
import { useForgotPassword } from "./auth.hooks";

export const ForgetPassword = () => {
   const [isSubmitted, setIsSubmitted] = useState(false);

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<ForgetPasswordFormValue>({
      resolver: zodResolver(forgotPasswordSchema),
   });

   const forgot = useForgotPassword();

   const onSubmit = (values: ForgetPasswordFormValue) => {
      forgot.mutate(values, {
         onSuccess: () => {
            setIsSubmitted(true);
         },
      });
   };

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
            
            {/* Navigation Header */}
            <div className="relative z-50 bg-white border-b border-slate-100">
               {/* <PublicNavbar /> */}
            </div>

            {/* Main Content Layout with True Diagonal Split ( / ) */}
            <main className="flex-1 flex flex-col lg:flex-row relative z-10 w-full overflow-hidden">
               
               {/* Left Section: Black Background with Sky & Green Accents (Diagonal Cut) */}
               <div className="hidden lg:flex w-[55%] bg-black text-white p-16 xl:p-24 flex-col justify-between relative overflow-hidden animate-fade-up delay-100 diagonal-split-clip">
                  
                  {/* Glowing Ambiance Lights (Sky & Green) */}
                  <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-10 right-20 w-[450px] h-[450px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />

                  <div className="relative z-10 space-y-6 max-w-lg">
                     <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                        Secure Access Recovery
                     </div>
                     <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                        Recover Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                           Merchant Gateway.
                        </span>
                     </h1>
                     <p className="text-slate-400 text-lg leading-relaxed">
                        Regain secure access to your global infrastructure, webhook management logs, and cross-border routing dashboards instantly.
                     </p>
                  </div>

                  <div className="relative z-10 pt-10 border-t border-slate-800/80 flex items-center justify-between text-sm text-slate-400 max-w-lg">
                     <div>
                        <p className="font-bold text-white text-base">Encrypted Reset</p>
                        <p className="text-xs text-slate-500 mt-0.5">Secure Token Verification</p>
                     </div>
                     <div className="h-8 w-[1px] bg-slate-800" />
                     <div>
                        <p className="font-bold text-white text-base">24/7 Support</p>
                        <p className="text-xs text-slate-500 mt-0.5">Enterprise Assistance</p>
                     </div>
                  </div>
               </div>

               {/* Right Section: Clean White Workspace & Form */}
               <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-12 xl:p-20 bg-white animate-fade-up delay-200">
                  <div className="w-full max-w-md space-y-8">
                     
                     <div className="text-left space-y-2">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reset password</h2>
                        <p className="text-sm text-slate-500">
                           Enter your work email address and we'll send you a secure link to reset your credentials.
                        </p>
                     </div>

                     {isSubmitted || forgot.isSuccess ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                           <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                              ✓
                           </div>
                           <div className="space-y-1">
                              <h3 className="font-bold text-slate-900 text-lg">Check your inbox</h3>
                              <p className="text-sm text-slate-600">
                                 We have sent password recovery instructions to your email address.
                              </p>
                           </div>
                           <Link to="/login" className="block w-full mt-2">
                              <Button
                                 className="w-full h-11 text-sm font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-md transition-all border-0"
                              >
                                 Return to sign in
                              </Button>
                           </Link>
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

                           {forgot.isError && (
                              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                 <p className="text-xs text-red-600 text-center font-medium">
                                    {/* @ts-ignore */}
                                    {forgot.error?.message || "Failed to send reset link. Please try again."}
                                 </p>
                              </div>
                           )}

                           <Button
                              type="submit"
                              className="w-full h-12 text-base font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all border-0 mt-2"
                              disabled={forgot.isPending}
                           >
                              {forgot.isPending ? (
                                 <span className="flex items-center gap-2">
                                    <Spinner className="size-5 text-white" /> Sending Reset Link...
                                 </span>
                              ) : "Send Reset Instructions"}
                           </Button>
                        </form>
                     )}

                     {!isSubmitted && !forgot.isSuccess && (
                        <p className="text-center text-sm text-slate-500 pt-4">
                           Remembered your password?{" "}
                           <Link to="/login" className="font-bold text-sky-600 hover:text-sky-500 transition-colors">
                              Sign in
                           </Link>
                        </p>
                     )}
                  </div>
               </div>

            </main>
         </div>
      </>
   );
};