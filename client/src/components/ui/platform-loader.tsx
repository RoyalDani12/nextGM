import { cn } from "@/lib/utils";

interface PlatformLoaderProps {
    text?: string;
    fullHeight?: boolean;
    className?: string;
}

export function PlatformLoader({ 
    text = "Loading...", 
    fullHeight = true,
    className 
}: PlatformLoaderProps) {
    return (
        <div 
            className={cn(
                "flex flex-col items-center justify-center w-full",
                fullHeight ? "min-h-[400px] h-full" : "py-8",
                className
            )}
        >
            <div className="relative size-12 mb-4">
                {/* Outer Background Ring (⚪ Light Slate) */}
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-100"></div>
                
                {/* Spinning Primary Ring (🟢 Green) */}
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent border-l-transparent animate-spin"></div>
                
                {/* Inner Pulsing Dot (🟠 Amber) for that unique SaaS touch */}
                <div className="absolute inset-0 m-auto size-2 rounded-full bg-amber-500 animate-pulse"></div>
            </div>
            
            {/* Minimalist Loading Text (⚫ Dark Slate / Grey) */}
            {text && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}