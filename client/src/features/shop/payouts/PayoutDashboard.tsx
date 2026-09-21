import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePayoutStatus, useGenerateOnboardingLink, useWithdrawFunds } from "./payouts.hooks";
import { DollarSign, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PayoutDashboard() {
  const { shopId } = useParams<{ shopId: string }>();
  
  const { data: status, isLoading, isError, refetch } = usePayoutStatus(shopId!);
  const onboardMutation = useGenerateOnboardingLink(shopId!);
  const withdrawMutation = useWithdrawFunds(shopId!);

  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading payout status...</div>;
  if (isError || !status) return <div className="p-8 text-center text-red-500">Failed to load payout status.</div>;

  const balance = Number(status.balance);
  const isConnected = !!status.stripeAccountId;
  const isReady = status.payoutsEnabled;

  const handleOnboard = async () => {
    try {
      setLocalError(null);
      const res = await onboardMutation.mutateAsync();
      window.location.href = res.url;
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || "Failed to generate onboarding link.");
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const amountNum = parseFloat(withdrawAmount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setLocalError("Please enter a valid amount.");
      return;
    }
    
    if (amountNum > balance) {
      setLocalError("Amount exceeds your available balance.");
      return;
    }

    try {
      await withdrawMutation.mutateAsync(amountNum);
      setWithdrawAmount("");
      alert(`Successfully withdrew $${amountNum.toFixed(2)} to your bank account!`);
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || "Withdrawal failed.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-2xl font-bold">Payouts & Wallet</h1>

      {localError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Balance Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-gray-500">
            <DollarSign className="h-5 w-5" />
            <h2 className="font-semibold text-gray-700">Available Balance</h2>
          </div>
          <p className="text-4xl font-bold tracking-tight">${balance.toFixed(2)}</p>
          <p className="mt-2 text-sm text-gray-500">Funds available for withdrawal</p>
        </div>

        {/* Stripe Connection Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="font-semibold text-gray-700">Bank Account</h2>
            </div>
            {isReady ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">Connected & Verified</span>
            ) : isConnected ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Pending Verification</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">Not Connected</span>
            )}
          </div>

          {!isReady && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600">
                You must connect a bank account via Stripe to withdraw your funds.
              </p>
              <button 
                onClick={handleOnboard}
                disabled={onboardMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#635BFF] px-4 py-2.5 font-medium text-white transition hover:bg-[#5349e5] disabled:opacity-50"
              >
                {onboardMutation.isPending ? "Generating..." : "Connect with Stripe"}
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          )}

          {isReady && (
            <form onSubmit={handleWithdraw} className="mt-6 space-y-4 border-t pt-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Withdraw Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={withdrawMutation.isPending || balance <= 0}
                    className="w-full rounded-lg border py-2.5 pl-8 pr-4 outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={withdrawMutation.isPending || balance <= 0 || !withdrawAmount}
                className="w-full rounded-lg bg-black px-4 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {withdrawMutation.isPending ? "Processing..." : "Withdraw Funds"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
