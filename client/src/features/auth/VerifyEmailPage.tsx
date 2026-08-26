import { useSearchParams, Link } from "react-router-dom";
import { useVerifyEmail } from "./auth.hooks"; // adjust import path as needed
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
   const [searchParams] = useSearchParams();
   const token = searchParams.get("token");

   const { status, data, error } = useVerifyEmail(token);

   return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
         <Card className="w-full max-w-sm text-center shadow-sm">
            <CardHeader className="flex flex-col items-center gap-2">
               {status === "pending" && (
                  <>
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     <CardTitle>Verifying Email</CardTitle>
                     <CardDescription>Please wait while we verify your account...</CardDescription>
                  </>
               )}

               {status === "success" && (
                  <>
                     <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                     <CardTitle className="text-slate-900">Verified!</CardTitle>
                     <CardDescription>
                        {(data as any)?.message ||
                           (data as any)?.response?.message ||
                           "Your email has been successfully verified."}
                     </CardDescription>
                  </>
               )}

               {status === "error" && (
                  <>
                     <XCircle className="h-10 w-10 text-destructive" />
                     <CardTitle className="text-destructive">Verification Failed</CardTitle>
                     <CardDescription>
                        {(error as any)?.response?.data?.message ||
                           "Invalid or expired verification link."}
                     </CardDescription>
                  </>
               )}
            </CardHeader>

            {status !== "pending" && (
               <CardFooter>
                  <Button render={<Link to="/login" />} className="w-full">
                     {status === "success" ? "Sign In" : "Back to sign in"}
                  </Button>
               </CardFooter>
            )}
         </Card>
      </div>
   );
}
