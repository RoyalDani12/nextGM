import { useState } from "react";
import {
   NavigationMenu,
   NavigationMenuList,
   NavigationMenuItem,
   NavigationMenuTrigger,
   NavigationMenuContent,
   NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { SearchOverlay } from "./SearchOverlay.js";
import { ShoppingCart, User, Globe, Search, Heart, Home, Tag } from "lucide-react";

export function Navbar() {
   const [isSearchOpen, setIsSearchOpen] = useState(false);

   // The text items matching your image_239af1.png reference
   const announcements = [
      "NEW MEMBERS GET 20% OFF THEIR FIRST ORDER",
      "COMPLIMENTARY GIFT WRAPPING AVAILABLE AT CHECKOUT",
      "LIMITED EDITION CASHMERE COLLECTION — NOW LIVE",
   ];

   return (
      <>
         {/* ================= INFINITE MARQUEE TICKER BAR ================= */}
         <div className="w-full bg-gray-800 text-white text-[11px] font-bold tracking-widest py-2.5 overflow-hidden border-b border-white/5 select-none uppercase">
            {/* We duplicate the array block to ensure an endless continuous loop trail */}
            <div className="animate-marquee whitespace-nowrap flex items-center gap-16">
               {[...announcements, ...announcements].map((text, index) => (
                  <div key={index} className="flex items-center gap-16 shrink-0">
                     <span>{text}</span>
                     <span className="text-white/40 text-xs font-normal">•</span>
                  </div>
               ))}
            </div>
         </div>

         {/* DESKTOP HEADER */}
         <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 hidden md:block">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
               {/* Logo Name */}
               <div className="text-xl font-black tracking-tight text-slate-900">
                  LUXE<span className="text-orange-500">.</span>
               </div>

               {/* Navigation Links */}
               <nav className="flex items-center gap-6">
                  <NavigationMenu>
                     <NavigationMenuList className="gap-2">
                        <NavigationMenuItem>
                           <NavigationMenuTrigger className="text-base font-semibold px-4 py-2 rounded-xl bg-slate-50 text-slate-900">
                              Shop
                           </NavigationMenuTrigger>
                           <NavigationMenuContent className="p-8 bg-white md:w-210 rounded-3xl shadow-xl border border-slate-100 grid grid-cols-4 gap-8">
                              <div className="flex flex-col gap-3">
                                 <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500">
                                    Women
                                 </h4>
                                 <div className="flex flex-col gap-2 text-[15px] font-medium text-slate-600">
                                    <NavigationMenuLink
                                       href="#"
                                       className="flex items-center gap-2 text-slate-900"
                                    >
                                       New Arrivals{" "}
                                       <span className="text-[10px] bg-orange-600 text-white font-bold px-1.5 py-0.5 rounded-md">
                                          NEW
                                       </span>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink href="#" className="hover:text-orange-600">
                                       Tops & Blouses
                                    </NavigationMenuLink>
                                    <NavigationMenuLink href="#" className="hover:text-orange-600">
                                       Dresses
                                    </NavigationMenuLink>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-3">
                                 <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500">
                                    Men
                                 </h4>
                                 <div className="flex flex-col gap-2 text-[15px] font-medium text-slate-600">
                                    <NavigationMenuLink
                                       href="#"
                                       className="flex items-center gap-2 text-slate-900"
                                    >
                                       New Arrivals{" "}
                                       <span className="text-[10px] bg-orange-600 text-white font-bold px-1.5 py-0.5 rounded-md">
                                          NEW
                                       </span>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink href="#" className="hover:text-orange-600">
                                       Shirts
                                    </NavigationMenuLink>
                                    <NavigationMenuLink href="#" className="hover:text-orange-600">
                                       Outerwear
                                    </NavigationMenuLink>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-3">
                                 <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500">
                                    Collections
                                 </h4>
                                 <div className="flex flex-col gap-2 text-[15px] font-medium text-slate-600">
                                    <NavigationMenuLink href="#" className="hover:text-orange-600">
                                       Summer Edit
                                    </NavigationMenuLink>
                                    <NavigationMenuLink href="#" className="hover:text-orange-600">
                                       Office Essentials
                                    </NavigationMenuLink>
                                 </div>
                              </div>
                              <div className="relative rounded-2xl overflow-hidden bg-slate-100 flex flex-col justify-end p-4 aspect-4/5">
                                 <img
                                    src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=300&q=80"
                                    className="absolute inset-0 w-full h-full object-cover"
                                 />
                                 <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                                 <div className="relative text-white">
                                    <h5 className="text-sm font-bold">New Season</h5>
                                 </div>
                              </div>
                           </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                           <NavigationMenuLink
                              href="#"
                              className="text-base font-medium text-slate-600 px-3 py-2 block"
                           >
                              New Arrivals
                           </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                           <NavigationMenuLink
                              href="#"
                              className="text-base font-medium text-slate-600 px-3 py-2 block"
                           >
                              Collections
                           </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                           <NavigationMenuLink
                              href="#"
                              className="text-base font-medium text-orange-600 px-3 py-2 block"
                           >
                              Sale
                           </NavigationMenuLink>
                        </NavigationMenuItem>
                     </NavigationMenuList>
                  </NavigationMenu>
               </nav>

               {/* Desktop Utilities */}
               <div className="flex items-center gap-8 text-slate-600">
                  <button className="flex items-center gap-1 text-sm font-medium">
                     <Globe className="size-6" /> <span>us en</span>
                  </button>
                  <button className="flex items-center gap-1 text-sm font-medium">
                     <span>USD $</span>
                  </button>
                  <button
                     onClick={() => setIsSearchOpen(true)}
                     className="hover:text-slate-900 cursor-pointer"
                  >
                     <Search className="size-6" />
                  </button>
                  <button className="hover:text-slate-900 cursor-pointer">
                     <User className="size-6" />
                  </button>
                  <button className="hover:text-slate-900 cursor-pointer">
                     <Heart className="size-6" />
                  </button>
                  <button className="relative hover:text-slate-900 cursor-pointer">
                     <ShoppingCart className="size-7" />
                     <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[9px] font-bold rounded-full size-4 flex items-center justify-center">
                        5
                     </span>
                  </button>
               </div>
            </div>
         </header>

         {/* ================= MOBILE BOTTOM NAV BAR ================= */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] px-2 py-2.5 flex justify-around items-center z-50">
            <a
               href="#"
               className="flex flex-col items-center gap-1 text-blue-600 min-w-14 decoration-none"
            >
               <Home className="size-5 stroke-[2.5]" />
               <span className="text-[10px] font-bold tracking-wide">Home</span>
            </a>
            <button
               onClick={() => setIsSearchOpen(true)}
               className="flex flex-col items-center gap-1 text-slate-400 min-w-14 cursor-pointer bg-transparent border-0 p-0"
            >
               <Search className="size-5 stroke-2" />
               <span className="text-[10px] font-medium tracking-wide">Search</span>
            </button>
            <a
               href="#"
               className="flex flex-col items-center gap-1 text-slate-400 min-w-14 decoration-none"
            >
               <ShoppingCart className="size-5 stroke-2" />
               <span className="text-[10px] font-medium tracking-wide">Cart</span>
            </a>
            <a
               href="#"
               className="flex flex-col items-center gap-1 text-slate-400 min-w-14 decoration-none"
            >
               <Tag className="size-5 stroke-2" />
               <span className="text-[10px] font-medium tracking-wide">Deals</span>
            </a>
            <a
               href="#"
               className="flex flex-col items-center gap-1 text-slate-400 min-w-14 decoration-none"
            >
               <User className="size-5 stroke-2" />
               <span className="text-[10px] font-medium tracking-wide">Profile</span>
            </a>
         </div>

         {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
      </>
   );
}
