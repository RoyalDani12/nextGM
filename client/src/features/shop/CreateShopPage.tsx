import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, PackagePlus, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createShopSchema, type CreateShopFormValues } from "./shop.schema";
import { useCreateShop } from "./shop.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error && "response" in error) {
    const response = error.response;
    if (typeof response === "object" && response && "data" in response) {
      const data = response.data;
      if (typeof data === "object" && data && "message" in data && typeof data.message === "string") return data.message;
    }
  }
  return "We couldn’t create your shop. Please try again.";
};

export const CreateShopPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateShopFormValues>({ resolver: zodResolver(createShopSchema) });
  const createShop = useCreateShop();

  const onSubmit = (values: CreateShopFormValues) => {
    createShop.mutate(values, { onSuccess: ({ data: shop }) => navigate(`/dashboard/shop/${shop.id}`, { replace: true }) });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/shops");
  };

  return <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:py-12"><div className="mx-auto max-w-5xl"><button type="button" onClick={handleBack} className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"><ArrowLeft className="size-4" /> Back</button><div className="grid overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_70px_rgba(15,23,42,0.09)] lg:grid-cols-[1.05fr_0.95fr]"><section className="bg-slate-900 p-7 text-white sm:p-10"><div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30"><Store className="size-6" /></div><p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Seller onboarding</p><h1 className="mt-3 max-w-md text-3xl font-bold tracking-tight sm:text-4xl">Open your storefront in a minute.</h1><p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Start with a name. You can add your brand, products, payout details, and store information from your dashboard next.</p><div className="mt-10 space-y-4">{[[Store, "Choose your shop name"], [PackagePlus, "Add products when you’re ready"], [CheckCircle2, "Complete your seller setup"]].map(([Icon, label]) => { const StepIcon = Icon as typeof Store; return <div key={label as string} className="flex items-center gap-3 text-sm text-slate-200"><div className="flex size-8 items-center justify-center rounded-xl bg-white/10"><StepIcon className="size-4 text-orange-300" /></div>{label as string}</div>; })}</div></section><section className="p-7 sm:p-10"><div className="max-w-md"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Create shop</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Give your shop a name</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use the name customers will recognize. You can refine your public profile after creating it.</p><form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5"><div className="space-y-2"><Label htmlFor="name" className="text-sm font-semibold text-slate-800">Shop name</Label><Input id="name" autoFocus placeholder="e.g. Nat Spare Parts" {...register("name")} className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-base focus-visible:border-orange-500 focus-visible:ring-orange-500/20" />{errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}</div>{createShop.isError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{getErrorMessage(createShop.error)}</p>}<Button type="submit" className="h-12 w-full rounded-xl bg-orange-500 text-base font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600" disabled={createShop.isPending}>{createShop.isPending ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating your shop…</> : <>Create shop <ArrowRight className="ml-2 size-4" /></>}</Button></form><p className="mt-5 text-center text-xs leading-5 text-slate-400">Creating a shop opens its dashboard immediately so you can finish setup.</p></div></section></div></div></main>;
};
