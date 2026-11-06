import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useVerifyEmail, useResendVerification } from "./auth.hooks";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Loader2, CheckCircle2, XCircle, Mail, Send, Clock, AlertCircle } from "lucide-react";

export default function VerifyEmailPage() {
   const [searchParams] = useSearchParams();
   const token = searchParams.get("token");

   const { status, data, error } = useVerifyEmail(token);

   const [email, setEmail] = useState("");
   const [resendCooldown, setResendCooldown] = useState(0);
   const [resendSuccess, setResendSuccess] = useState<string | null>(null);
   const [resendError, setResendError] = useState<string | null>(null);

   const resendVerification = useResendVerification();

   useEffect(() => {
      if (resendCooldown <= 0) return;
      const timer = setInterval(() => {
         setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
   }, [resendCooldown]);

   const handleResend = (e: React.FormEvent) => {
      e.preventDefault();
      const targetEmail = email.trim();
      if (!targetEmail) {
         setResendError("Please enter your email to receive a new link.");
         return;
      }
      setResendError(null);
      setResendSuccess(null);

      resendVerification.mutate(targetEmail, {
         onSuccess: (res) => {
            setResendSuccess(res?.message || "Verification link sent! Check your inbox.");
            setResendCooldown(60);
         },
         onError: (err: any) => {
            setResendError(
               err?.response?.data?.message ||
                  "Unable to resend verification email. Please try again later."
            );
         },
      });
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECEFF4] dark:bg-[#0B0F19] p-4 sm:p-6 font-sans antialiased">
         <Card className="w-full max-w-md text-center shadow-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-2 sm:p-4">
            <CardHeader className="flex flex-col items-center gap-2">
               {status === "pending" && (
                  <>
                     <div className="size-14 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-[#F97316] mb-2">
                        <Loader2 className="h-7 w-7 animate-spin" />
                     </div>
                     <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Verifying Email</CardTitle>
                     <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Please wait while we verify your account...
                     </CardDescription>
                  </>
               )}

               {status === "success" && (
                  <>
                     <div className="size-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                        <CheckCircle2 className="h-8 w-8" />
                     </div>
                     <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Email Verified!</CardTitle>
                     <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        {(data as any)?.message ||
                           (data as any)?.response?.message ||
                           "Your email has been successfully verified. You can now log in."}
                     </CardDescription>
                  </>
               )}

               {status === "error" && (
                  <>
                     <div className="size-14 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 mb-2">
                        <XCircle className="h-8 w-8" />
                     </div>
                     <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Verification Failed</CardTitle>
                     <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        {(error as any)?.response?.data?.message ||
                           "Invalid or expired verification link."}
                     </CardDescription>
                  </>
               )}
            </CardHeader>

            {status === "error" && (
               <CardContent className="space-y-3 pt-2 text-left">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 space-y-2">
                     <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Request a new verification link
                     </p>
                     <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                        Enter your email below and click "Send verification again".
                     </p>

                     {resendSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                           <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                           <span>{resendSuccess}</span>
                        </div>
                     )}

                     {resendError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                           <AlertCircle className="size-4 shrink-0" />
                           <span>{resendError}</span>
                        </div>
                     )}

                     <form onSubmit={handleResend} className="space-y-2 pt-1">
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                           <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your account email"
                              required
                              className="h-9 bg-white dark:bg-zinc-800 text-xs pl-9 pr-3 rounded-xl"
                           />
                        </div>
                        <Button
                           type="submit"
                           disabled={resendVerification.isPending || resendCooldown > 0}
                           className="w-full h-9 rounded-xl bg-[#F97316] hover:bg-[#ea660c] text-white text-xs font-bold shadow-xs inline-flex items-center justify-center gap-2"
                        >
                           {resendVerification.isPending ? (
                              <>
                                 <Spinner className="size-3.5 text-white" />
                                 <span>Sending link...</span>
                              </>
                           ) : resendCooldown > 0 ? (
                              <>
                                 <Clock className="size-3.5 text-white" />
                                 <span>Send verification again in {resendCooldown}s</span>
                              </>
                           ) : (
                              <>
                                 <Send className="size-3.5 text-white" />
                                 <span>Send verification again</span>
                              </>
                           )}
                        </Button>
                     </form>
                  </div>
               </CardContent>
            )}

            {status !== "pending" && (
               <CardFooter className="pt-2">
                  <Button
                     render={<Link to="/login" />}
                     variant={status === "success" ? "default" : "outline"}
                     className={`w-full h-10 rounded-xl text-xs font-bold ${
                        status === "success"
                           ? "bg-[#F97316] hover:bg-[#ea660c] text-white shadow-md"
                           : "border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800"
                     }`}
                  >
                     {status === "success" ? "Sign In to Your Account" : "Back to sign in"}
                  </Button>
               </CardFooter>
            )}
         </Card>
      </div>
   );
}
