import { Link } from "react-router-dom";

// Custom SVGs matching Lucide's style for the brand icons
const Twitter = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
);

const Github = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const Instagram = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative z-10 w-full bg-slate-900 border-t border-slate-800 text-slate-300 mt-auto">
            {/* Back to top button row */}
            <button 
                onClick={scrollToTop}
                className="w-full bg-slate-800/60 hover:bg-slate-800 py-3 text-xs font-semibold text-slate-300 hover:text-white transition-colors border-b border-slate-800/80 cursor-pointer"
            >
                Back to top
            </button>

            {/* Main Links Grid (Amazon Multi-Column Structure) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
                    
                    {/* Column 1: Logo + Get to Know Us */}
                    <div className="flex flex-col gap-4">
                        <Link to="/" className="block group w-fit">
                            <img 
                                src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png" 
                                alt="Nexions Logo" 
                                className="h-7 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </Link>
                        <p className="font-bold text-white text-sm tracking-wide">Get to Know Us</p>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link to="/about" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">About Nexions</Link></li>
                            <li><Link to="/about#careers" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Careers</Link></li>
                            <li><Link to="/about#blog" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Nexions Science & Blog</Link></li>
                            <li><Link to="/about#press" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Press Releases</Link></li>
                        </ul>
                    </div>

                    {/* Column 2: Make Money with Us */}
                    <div className="flex flex-col gap-3">
                        <p className="font-bold text-white text-sm tracking-wide">Make Money with Us</p>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link to="/shops/new" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Sell on Nexions</Link></li>
                            <li><Link to="/about#templates" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Store Templates</Link></li>
                            <li><Link to="/about#experts" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Advertise Your Products</Link></li>
                            <li><Link to="/about#affiliates" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Become an Affiliate</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Engine & Payment */}
                    <div className="flex flex-col gap-3">
                        <p className="font-bold text-white text-sm tracking-wide">Engine & Payment</p>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link to="/about#integrations" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Nexions Business Card</Link></li>
                            <li><Link to="/about#currency" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Global Currency Converter</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Let Us Help You */}
                    <div className="flex flex-col gap-3">
                        <p className="font-bold text-white text-sm tracking-wide">Let Us Help You</p>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link to="/account/settings" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Your Account</Link></li>
                            <li><Link to="/orders" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Manage Orders</Link></li>
                            <li><Link to="/help" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Help Center</Link></li>
                            <li><Link to="/contact" className="text-slate-400 hover:text-orange-400 hover:underline transition-colors">Contact Support</Link></li>
                        </ul>
                    </div>

                </div>

                {/* Divider */}
                <div className="h-px w-full bg-slate-800 my-10" />

                {/* Promo notice & Socials Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    {/* Promo notice */}
                    <p className="text-xs text-slate-400 text-center md:text-left">
                        Next-Gen Physical E-Commerce Engine. <span className="text-orange-400 font-bold">Enjoy Zero Fees on Your First Order.</span>
                    </p>

                    {/* Socials */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                                <Twitter className="size-4" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                                <Github className="size-4" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                                <Linkedin className="size-4" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                                <Instagram className="size-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Legal links bar */}
                <div className="mt-8 pt-6 border-t border-slate-800/60 text-center text-[11px] text-slate-500 flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <Link to="/legal/conditions" className="hover:underline">Conditions of Use</Link>
                    <Link to="/legal/privacy" className="hover:underline">Privacy Notice</Link>
                    <Link to="/legal/ads" className="hover:underline">Interest-Based Ads</Link>
                    <span>© {currentYear}, Nexions Inc. or its affiliates</span>
                </div>

            </div>
        </footer>
    );
}