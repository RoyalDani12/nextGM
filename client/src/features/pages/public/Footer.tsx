import { Link } from "react-router-dom";
import { Sparkles, Send, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Custom SVGs matching Lucide's style for the removed brand icons
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

    return (
        <footer className="bg-white border-t border-zinc-200 pt-16 pb-8 mt-auto">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-16">
                    
                    {/* Brand & Newsletter Section */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Link to="/" className="flex items-center gap-2.5 group w-fit">
                            <div className="size-8 bg-zinc-950 flex items-center justify-center text-white rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105">
                                <Sparkles className="size-4.5 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-zinc-950">
                                Nexions
                            </span>
                        </Link>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-medium">
                            The all-in-one platform to build, manage, and scale your online business. Sell everywhere with zero friction.
                        </p>
                        
                        <div className="mt-2">
                            <p className="text-sm font-bold text-zinc-950 mb-3">Subscribe to our newsletter</p>
                            <div className="flex items-center gap-2 max-w-md">
                                <Input 
                                    type="email" 
                                    placeholder="Enter your email..." 
                                    className="bg-zinc-50 border-zinc-200 h-10 rounded-xl focus-visible:ring-zinc-950/5 focus-visible:border-zinc-950"
                                />
                                <Button className="bg-zinc-950 hover:bg-zinc-800 text-white h-10 px-4 rounded-xl font-bold transition-all active:scale-95">
                                    <Send className="size-4 mr-2" />
                                    Subscribe
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-zinc-950 text-sm tracking-wide">Product</h3>
                        <ul className="flex flex-col gap-3">
                            <li><Link to="/features" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Features</Link></li>
                            <li><Link to="/pricing" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Pricing</Link></li>
                            <li><Link to="/templates" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Store Templates</Link></li>
                            <li><Link to="/integrations" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-2">Integrations <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold">New</span></Link></li>
                            <li><Link to="/changelog" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-zinc-950 text-sm tracking-wide">Resources</h3>
                        <ul className="flex flex-col gap-3">
                            <li><Link to="/help" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Help Center</Link></li>
                            <li><Link to="/docs" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">API Documentation</Link></li>
                            <li><Link to="/blog" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Blog & Guides</Link></li>
                            <li><Link to="/community" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Community Forum</Link></li>
                            <li><Link to="/experts" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Hire an Expert</Link></li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-zinc-950 text-sm tracking-wide">Company</h3>
                        <ul className="flex flex-col gap-3">
                            <li><Link to="/about" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">About Us</Link></li>
                            <li><Link to="/careers" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors flex items-center group">Careers <ArrowRight className="size-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-zinc-950" /></Link></li>
                            <li><Link to="/contact" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Contact Sales</Link></li>
                            <li><Link to="/legal/privacy" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/legal/terms" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Separator Divider */}
                <div className="h-px w-full bg-zinc-200 mb-8" />

                {/* Bottom Section (Copyright & Socials) */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm font-medium text-zinc-500">
                        © {currentYear} Nexions Inc. All rights reserved.
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="size-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                            <Twitter className="size-4" />
                            <span className="sr-only">Twitter</span>
                        </a>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="size-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                            <Github className="size-4" />
                            <span className="sr-only">GitHub</span>
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="size-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                            <Linkedin className="size-4" />
                            <span className="sr-only">LinkedIn</span>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="size-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                            <Instagram className="size-4" />
                            <span className="sr-only">Instagram</span>
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
}