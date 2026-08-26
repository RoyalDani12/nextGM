import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { registerSchema, type RegisterFormValues } from "./auth.schema";
import { useRegister } from "./auth.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
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
            
            {/* Header with NextG Logo Link */}
            <header className="relative z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
               <Link 
                  to="/" 
                  className="flex items-center gap-2.5 text-slate-900 hover:opacity-85 transition-opacity"
                  aria-label="NextG Home"
               >
                  {/* NextG Custom Icon Badge */}
                  <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                     <span className="text-emerald-400">N</span>G
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                     Next<span className="text-emerald-600">G</span>
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

            {/* Main Content Layout with Diagonal Split */}
            <main className="flex-1 flex flex-col lg:flex-row relative z-10 w-full overflow-hidden">
               
               {/* Left Hero Section */}
               <div className="hidden lg:flex w-[55%] bg-slate-950 text-white p-16 xl:p-24 flex-col justify-between relative overflow-hidden animate-fade-up delay-100 diagonal-split-clip">
                  
                  {/* Ambient Glows */}
                  <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-10 left-20 w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

                  <div className="relative z-10 space-y-6 max-w-lg">
                     <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                        Merchant Onboarding
                     </div>
                     <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                        Launch Globally, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-orange-400">
                           Settle Instantly.
                        </span>
                     </h1>
                     <p className="text-slate-400 text-lg leading-relaxed">
                        Join modern international merchants scaling across borders with zero-configuration multi-currency architecture and automated compliance.
                     </p>
                  </div>

                  <div className="relative z-10 space-y-3.5 pt-10 border-t border-slate-800 max-w-lg">
                     {[
                        "Multi-currency instant checkout routing",
                        "Automated cross-border tax calculation",
                        "Enterprise webhook management & real-time logs",
                     ].map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                           <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                           {benefit}
                        </div>
                     ))}
                  </div>
               </div>

               {/* Right Section: Workspace Form */}
               <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-12 xl:p-20 bg-white animate-fade-up delay-200">
                  <div className="w-full max-w-md space-y-6">
                     
                     <div className="text-left space-y-2">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create merchant account</h2>
                        <p className="text-sm text-slate-500">Initialize your multi-currency NextG storefront.</p>
                     </div>

                     <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                           <Label htmlFor="name" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Full Name</Label>
                           <Input 
                              id="name" 
                              className="h-11 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                              placeholder="Alex Morgan"
                              autoComplete="name" 
                              {...register("name")} 
                           />
                           {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                           <Label htmlFor="email" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Work Email</Label>
                           <Input 
                              id="email" 
                              type="email" 
                              className="h-11 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                              placeholder="you@company.com"
                              autoComplete="email" 
                              {...register("email")} 
                           />
                           {errors.email && <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <Label htmlFor="password" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Password</Label>
                              <Input 
                                 id="password" 
                                 type="password" 
                                 className="h-11 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                                 placeholder="••••••••"
                                 autoComplete="new-password" 
                                 {...register("password")} 
                              />
                              {errors.password && <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>}
                           </div>

                           <div className="space-y-1.5">
                              <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Confirm</Label>
                              <Input 
                                 id="confirmPassword" 
                                 type="password" 
                                 className="h-11 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 rounded-xl shadow-sm"
                                 placeholder="••••••••"
                                 autoComplete="new-password" 
                                 {...register("confirmPassword")} 
                              />
                              {errors.confirmPassword && <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>}
                           </div>
                        </div>

                        {registerUser.isError && (
                           <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                              <p className="text-xs text-red-600 text-center font-medium">
                                 {(registerUser.error as any)?.response?.data?.message ?? "Registration failed. Please try again."}
                              </p>
                           </div>
                        )}

                        <Button 
                           type="submit" 
                           className="w-full h-11 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all border-0 mt-2" 
                           disabled={registerUser.isPending}
                        >
                           {registerUser.isPending ? (
                              <span className="flex items-center gap-2">
                                 <Spinner className="size-5 text-white" /> Initializing account...
                              </span>
                           ) : "Create merchant account"}
                        </Button>
                     </form>

                     <p className="text-center text-sm text-slate-500 pt-2">
                        Already have an account?{" "}
                        <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                           Sign in
                        </Link>
                     </p>
                  </div>
               </div>

            </main>
         </div>
      </>
    );
}