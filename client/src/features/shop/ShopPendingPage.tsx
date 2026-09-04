import { Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ShopPendingPage() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-amber-50">
                <Clock className="size-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Your shop is under review</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                We're reviewing your shop before it goes live. This usually takes a short while — check back soon.
            </p><Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-emerald-600"><ArrowLeft className="size-4" /> Back to workspace</Link>
        </div>
    );
}