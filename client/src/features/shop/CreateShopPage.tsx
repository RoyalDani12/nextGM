import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, Sparkles } from "lucide-react";
import { createShopSchema, type CreateShopFormValues } from "./shop.schema";
import { useCreateShop } from "./shop.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceNavbar } from "@/layouts/MarketplaceNavbar";

export const CreateShopPage = () => {
  const createShop = useCreateShop();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateShopFormValues>({ resolver: zodResolver(createShopSchema) });
  const error = createShop.error instanceof Error ? createShop.error.message : "Something went wrong. Please try again.";
  return <div className="min-h-screen bg-slate-50"><MarketplaceNavbar /><main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
    <div className="space-y-5"><div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"><Sparkles className="size-3.5" /> Start selling</div><h1 className="text-4xl font-black tracking-tight sm:text-5xl">Your next <span className="text-emerald-600">best seller</span> starts here.</h1><p className="max-w-md text-sm leading-7 text-slate-500">Name your storefront now. You can add branding, products, and payout details from your workspace.</p></div>
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><div className="mb-8 flex items-center gap-4"><div className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white"><Store className="size-5" /></div><div><h2 className="text-xl font-black">Create your shop</h2><p className="text-sm text-slate-500">Takes less than a minute.</p></div></div><form onSubmit={handleSubmit((values) => createShop.mutate(values))} className="space-y-5"><div className="space-y-2"><Label htmlFor="name">Shop name</Label><Input id="name" placeholder="e.g. Northstar Goods" {...register("name")} />{errors.name && <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>}</div>{createShop.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}<Button disabled={createShop.isPending} className="h-12 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800">{createShop.isPending ? "Creating shop…" : "Create shop"}</Button></form></div>
  </main></div>;
};
