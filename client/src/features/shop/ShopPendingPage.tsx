import { Clock } from "lucide-react";

export default function ShopPendingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="size-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Clock className="size-6 text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Your shop is under review</h1>
            <p className="text-sm text-slate-500 max-w-sm">
                We're reviewing your shop before it goes live. This usually takes a short while — check back soon.
            </p>
        </div>
    );
}