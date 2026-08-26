import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PublicNavbar } from "@/components/layout/marketplace/PublicNavbar";
import { useResetPassword } from "./auth.hooks";
import { type resetPasswordFormValues, resetPasswordSchema } from "./auth.schema";
import { useSearchParams} from "react-router-dom";


export const ResetPasswordPage = () => {
   const [isSubmitted, setIsSubmitted] = useState(false);
   const [searchParams] = useSearchParams()
const token = searchParams.get('token')
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<resetPasswordFormValues>({
      resolver: zodResolver(resetPasswordSchema),
   });

   const reset = useResetPassword();

   const onSubmit = (values: resetPasswordFormValues) => {
      if(!token){
        return
      }
      reset.mutate( { token,...values }, {
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
               <PublicNavbar />
            </div>

            {/* Main Content Layout with True Diagonal Split */}
            <main className="flex-1 flex flex-col lg:flex-row relative z-10 w-full overflow-hidden">
               
               {/* Left Section: Black Background with Accents */}
               <div className="hidden lg:flex w-[55%] bg-black text-white p-16 xl:p-24 flex-col justify-between relative overflow-hidden animate-fade-up delay-100 diagonal-split-clip">
                  <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-10 right-20 w-[450px] h-[450px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />

                  <div className="relative z-10 space-y-6 max-w-lg">
                     <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                        Secure Credential Update
                     </div>
                     <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                        Reset Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                           Password.
                        </span>
                     </h1>
                     <p className="text-slate-400 text-lg leading-relaxed">
                        Choose a strong new password to protect your merchant gateway, webhook logs, and administrative permissions.
                     </p>
                  </div>

                  <div className="relative z-10 pt-10 border-t border-slate-800/80 flex items-center justify-between text-sm text-slate-400 max-w-lg">
                     <div>
                        <p className="font-bold text-white text-base">Encrypted Vault</p>
                        <p className="text-xs text-slate-500 mt-0.5">Secure Hash Verification</p>
                     </div>
                     <div className="h-8 w-[1px] bg-slate-800" />
                     <div>
                        <p className="font-bold text-white text-base">Zero Trust</p>
                        <p className="text-xs text-slate-500 mt-0.5">Strict Access Control</p>
                     </div>
                  </div>
               </div>

               {/* Right Section: Form Workspace */}
               <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-12 xl:p-20 bg-white animate-fade-up delay-200">
                  <div className="w-full max-w-md space-y-8">
                     
                     <div className="text-left space-y-2">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create new password</h2>
                        <p className="text-sm text-slate-500">
                           Please enter your new password below. Make sure it is secure and unique.
                        </p>
                     </div>

                     {isSubmitted || reset.isSuccess ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                           <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                              ✓
                           </div>
                           <div className="space-y-1">
                              <h3 className="font-bold text-slate-900 text-lg">Password updated</h3>
                              <p className="text-sm text-slate-600">
                                 Your password has been successfully reset. You can now log in with your new credentials.
                              </p>
                           </div>
                           <Link to="/login" className="block w-full mt-2">
                              <Button className="w-full h-11 text-sm font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-md transition-all border-0">
                                 Return to sign in
                              </Button>
                           </Link>
                        </div>
                     ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                           <div className="space-y-2">
                              <Label htmlFor="password" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                                 New Password
                              </Label>
                              <Input
                                 type="password"
                                 id="password"
                                 placeholder="••••••••"
                                 className="h-12 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                                 {...register("newPassword")}
                              />
                              {errors.newPassword && (
                                 <p className="text-xs text-red-600 font-medium">{errors.newPassword.message}</p>
                              )}
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                                 Confirm Password
                              </Label>
                              <Input
                                 type="password"
                                 id="confirmPassword"
                                 placeholder="••••••••"
                                 className="h-12 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                                 {...register("confirmPassword")}
                              />
                              {errors.confirmPassword && (
                                 <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
                              )}
                           </div>

                           {reset.isError && (
                              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                 <p className="text-xs text-red-600 text-center font-medium">
                                    {/* @ts-ignore */}
                                    {reset.error?.message || "Failed to reset password. Please try again."}
                                 </p>
                              </div>
                           )}

                           <Button
                              type="submit"
                              className="w-full h-12 text-base font-bold bg-black hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all border-0 mt-2"
                              disabled={reset.isPending}
                           >
                              {reset.isPending ? (
                                 <span className="flex items-center gap-2">
                                    <Spinner className="size-5 text-white" /> Resetting Password...
                                 </span>
                              ) : (
                                 "Reset Password"
                              )}
                           </Button>
                        </form>
                     )}

                     {!isSubmitted && !reset.isSuccess && (
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