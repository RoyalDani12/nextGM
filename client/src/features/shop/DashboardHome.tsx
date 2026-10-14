import { Link, useParams } from "react-router-dom";
import { AlertCircle, BadgeCheck, Building2, CheckCircle2, CircleDashed, FileText, ImagePlus, Loader2, MapPin, PackagePlus, RefreshCw, Rocket, Store, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyShops, usePublishReadiness, usePublishShop } from "./shop.hooks";
import type { PublishReadinessChecks, ShopStatus } from "./shop.types";

const statusStyle: Record<ShopStatus, { label: string; className: string }> = {
  PENDING: { label: "Setup in progress", className: "bg-amber-100 text-amber-800 border-amber-200" },
  ACTIVE: { label: "Live", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PAUSED: { label: "Paused", className: "bg-blue-100 text-blue-800 border-blue-200" },
  SUSPENDED: { label: "Suspended", className: "bg-rose-100 text-rose-800 border-rose-200" },
  CLOSED: { label: "Closed", className: "bg-slate-200 text-slate-700 border-slate-300" },
};

const setupItems: Array<{ key: keyof PublishReadinessChecks; title: string; description: string; icon: typeof Store; destination: "settings" | "products" }> = [
  { key: "hasProfile", title: "Create your store profile", description: "Your store profile exists.", icon: Store, destination: "settings" },
  { key: "hasName", title: "Add a public store name", description: "Customers need a name to recognize your store.", icon: UserRound, destination: "settings" },
  { key: "hasDescription", title: "Add a store description", description: "Tell customers what your store offers.", icon: FileText, destination: "settings" },
  { key: "hasLogo", title: "Upload a store logo", description: "Add a recognizable visual identity.", icon: ImagePlus, destination: "settings" },
  { key: "hasContactInfo", title: "Add contact details", description: "Provide an email address or phone number.", icon: UserRound, destination: "settings" },
  { key: "hasAddress", title: "Add your business address", description: "Address, city, and country are required.", icon: MapPin, destination: "settings" },
  { key: "hasLegalInfo", title: "Provide legal business details", description: "Complete your business and tax information.", icon: Building2, destination: "settings" },
  { key: "hasAtLeastOneActiveProduct", title: "Publish at least one product", description: "Add and activate a product customers can buy.", icon: PackagePlus, destination: "products" },
];

export function DashboardHome() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const readiness = usePublishReadiness(shopId);
  const publishShop = usePublishShop(shopId);
  const { data: shopsResponse } = useMyShops();
  const shop = shopsResponse?.data?.find((item) => item.id === shopId);
  const dashboardPath = `/dashboard/shop/${shopId}`;

  if (readiness.isLoading) return <div className="flex min-h-[420px] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto size-7 animate-spin text-orange-500" /><p className="mt-3 text-sm text-slate-500">Checking your shop setup…</p></div></div>;
  if (readiness.isError || !readiness.data) return <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center"><AlertCircle className="mx-auto size-7 text-rose-600" /><h1 className="mt-3 font-semibold text-slate-900">We couldn’t check shop readiness</h1><p className="mt-1 text-sm text-slate-600">Your setup data is safe. Try checking again.</p><Button variant="outline" onClick={() => readiness.refetch()} className="mt-5 rounded-full"><RefreshCw className="mr-2 size-4" /> Check again</Button></div>;

  const { checks, passed, shopStatus } = readiness.data;
  const completed = setupItems.filter((item) => checks[item.key]).length;
  const percent = Math.round((completed / setupItems.length) * 100);
  const status = statusStyle[shopStatus];
  const canPublish = passed && shopStatus === "PENDING";

  return <div className="mx-auto w-full max-w-6xl space-y-7"><section className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.04)] md:p-8"><div className="flex flex-col gap-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15"><Store className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Current shop</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{shop?.profile?.name ?? "Your Shop"}</h1><p className="mt-1 text-sm text-slate-600">Live readiness is checked every 10 seconds.</p></div></div><span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}><BadgeCheck className="size-3.5" /> {status.label}</span></div><div><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">Publishing readiness</span><span className="font-bold text-slate-900">{completed} of {setupItems.length} complete</span></div><div className="h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-orange-500 transition-[width] duration-500" style={{ width: `${percent}%` }} /></div></div></div></section><section><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold tracking-tight text-slate-900">Shop setup</h2><p className="mt-1 text-sm text-slate-500">Complete these backend-verified requirements to publish your shop.</p></div><button onClick={() => readiness.refetch()} disabled={readiness.isFetching} className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-60"><RefreshCw className={`size-4 ${readiness.isFetching ? "animate-spin" : ""}`} /> Refresh status</button></div><div className="grid gap-3 md:grid-cols-2">{setupItems.map((item) => { const Icon = item.icon; const isComplete = checks[item.key]; return <Link key={item.key} to={`${dashboardPath}/${item.destination}`} className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"><div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${isComplete ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}><Icon className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-sm font-bold text-slate-900">{item.title}</h3>{isComplete && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Complete</span>}</div><p className="mt-1 text-xs leading-5 text-slate-500">{isComplete ? "Complete — this requirement is verified." : item.description}</p></div>{isComplete ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : <CircleDashed className="size-5 shrink-0 text-orange-500" />}</Link>; })}</div></section>{shopStatus === "PENDING" && <section className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">{passed ? "Your shop is ready to publish" : "Finish the remaining setup items"}</h2><p className="mt-1 text-sm text-slate-500">{passed ? "All required information is verified. You can now make your shop live." : `${setupItems.length - completed} requirement${setupItems.length - completed === 1 ? "" : "s"} still need attention.`}</p>{publishShop.isError && <p className="mt-2 text-sm text-rose-600">Publishing failed. Refresh readiness and try again.</p>}</div><Button disabled={!canPublish || publishShop.isPending} onClick={() => publishShop.mutate()} className="rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800">{publishShop.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Rocket className="mr-2 size-4" />}{passed ? "Publish shop" : "Not ready to publish"}</Button></section>}</div>;
}
