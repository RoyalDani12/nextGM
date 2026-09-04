import { ArrowUpRight, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/layout/BrandMark";

const groups = [
  { title: "Platform", links: [["Discover", "/"], ["Shops", "/shops"], ["Pricing", "/pricing"], ["Create a shop", "/create-shop"]] },
  { title: "Account", links: [["Sign in", "/login"], ["Register", "/register"], ["Settings", "/account/settings"], ["Cart", "/cart"]] },
  { title: "Company", links: [["About Nexions", "/"], ["Help center", "/"], ["Privacy", "/"], ["Terms", "/"]] },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_2fr] lg:py-20">
        <div className="space-y-5">
          <BrandMark />
          <p className="max-w-sm text-sm leading-6 text-slate-500">The trusted operating system for independent commerce. Discover, sell, and grow with less friction.</p>
          <a href="mailto:hello@nexions.example" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-emerald-600"><Mail className="size-4" /> hello@nexions.example</a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((group) => <div key={group.title}><p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{group.title}</p><ul className="space-y-3">{group.links.map(([label, href]) => <li key={href}><Link to={href} className="text-sm font-semibold text-slate-600 hover:text-emerald-600">{label}</Link></li>)}</ul></div>)}
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs font-medium text-slate-400 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Nexions. Built for independent commerce.</span>
          <span className="inline-flex items-center gap-2"><Sparkles className="size-3.5 text-emerald-500" /> Make every order count <ArrowUpRight className="size-3.5" /></span>
        </div>
      </div>
    </footer>
  );
}
