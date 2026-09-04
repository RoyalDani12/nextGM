import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface BrandMarkProps {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
}

export function BrandMark({ href = "/", inverted = false, compact = false }: BrandMarkProps) {
  const content = (
    <>
      <span className={`grid size-9 place-items-center rounded-xl ${inverted ? "bg-white text-slate-950" : "bg-slate-950 text-white"} shadow-sm`}>
        <Sparkles className="size-4" />
      </span>
      {!compact && (
        <span className={`text-xl font-black tracking-tight ${inverted ? "text-white" : "text-slate-950"}`}>
          Nex<span className={inverted ? "text-emerald-300" : "text-emerald-600"}>ions</span>
        </span>
      )}
    </>
  );

  return (
    <Link to={href} className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl" aria-label="Nexions home">
      {content}
    </Link>
  );
}
