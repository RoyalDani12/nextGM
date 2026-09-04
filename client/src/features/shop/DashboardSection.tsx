import { BarChart3, Box, PackageCheck, Settings2, Users } from "lucide-react";

const config = {
  orders: { title: "Orders", description: "Track fulfillment, payment status, and customer delivery updates.", icon: PackageCheck },
  products: { title: "Products", description: "Manage your catalog, inventory, and product visibility.", icon: Box },
  settings: { title: "Workspace settings", description: "Configure your store preferences and team access.", icon: Settings2 },
  analytics: { title: "Analytics", description: "Understand what is selling and where your customers come from.", icon: BarChart3 },
  customers: { title: "Customers", description: "Build stronger relationships with the people behind every order.", icon: Users },
} as const;

export function DashboardSection({ section }: { section: keyof typeof config }) {
  const item = config[section];
  const Icon = item.icon;
  return <section className="mx-auto max-w-5xl"><div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-sm sm:p-12"><div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon className="size-6" /></div><p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight">{item.title}</h1><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">{item.description}</p><div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">This area is ready for your live {item.title.toLowerCase()} data.</div></div></section>;
}
