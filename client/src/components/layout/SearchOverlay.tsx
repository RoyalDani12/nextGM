import { Search, X, TrendingUp, Clock, ArrowRight } from "lucide-react";

interface SearchOverlayProps {
   onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
   return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in duration-150">
         <div className="w-full bg-white px-6 py-10 shadow-2xl animate-in slide-in-from-top-4 duration-200">
            <div className="max-w-6xl mx-auto">
               {/* ================= PREMIUM SEARCH CONTAINER ================= */}
               <div
                  className="relative flex items-center border border-slate-200 rounded-2xl bg-slate-50/70 px-5 py-3.5 
            transition-all duration-300 ease-out group transform
            
            /* Enhanced Luxury Focus Look */
            focus-within:scale-[1.0]
            focus-within:bg-white 
            focus-within:border-black
            focus-within:ring-8
            focus-within:ring-slate-900/5
            focus-within:shadow-x"
               >
                  <Search className="size-5 text-slate-400 mr-3 transition-colors duration-300 group-focus-within:text-slate-900" />

                  <input
                     type="text"
                     placeholder="Search for products, brands, collections..."
                     autoFocus
                     className="w-full text-base bg-transparent outline-none text-slate-900 placeholder-slate-400 font-medium"
                  />

                  <button
                     onClick={onClose}
                     className="text-slate-400 hover:text-slate-900 cursor-pointer pl-2 transition-colors"
                  >
                     <X className="size-5" />
                  </button>
               </div>

               {/* ================= GRID CONTENT PANEL ================= */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10 border-t border-slate-100 pt-8">
                  {/* Column 1: Trending Searches */}
                  <div>
                     <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2 mb-5">
                        <TrendingUp className="size-4 text-orange-600" /> Trending Searches
                     </h4>
                     <ul className="flex flex-col gap-1 text-[15px] ml-4 font-medium text-slate-600">
                        {[
                           "Cashmere sweater",
                           "Leather tote bag",
                           "Chelsea leather boots",
                           "Oversized linen shirt",
                           "Tailored wool coat",
                        ].map((item) => (
                           <li key={item} className="group/item">
                              <a
                                 href="#"
                                 className="flex items-center justify-between py-2 rounded-lg px-2 -mx-2 hover:bg-slate-50 hover:text-orange-500 transition-all duration-200"
                              >
                                 <span className="group-hover/item:translate-x-1 transition-transform duration-200">
                                    {item}
                                 </span>
                                 <ArrowRight className="size-4 opacity-0 -translate-x-2 group-hover/item:opacity-1 group-hover/item:translate-x-0 transition-all duration-200 text-slate-400" />
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Column 2: Recent Searches */}
                  <div>
                     <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2 mb-5">
                        <Clock className="size-4" /> Recent Searches
                     </h4>
                     <ul className="flex flex-col gap-1 text-[15px] ml-4 font-medium text-slate-600 ">
                        {["Merino knit cardigan", "Heritage trench overcoat"].map((item) => (
                           <li key={item} className="group/item">
                              <a
                                 href="#"
                                 className="flex items-center justify-between py-2 rounded-lg px-2 -mx-2 hover:bg-slate-50 hover:text-orange-500 transition-all duration-200"
                              >
                                 <span className="group-hover/item:translate-x-1 transition-transform duration-200">
                                    {item}
                                 </span>
                                 <ArrowRight className="size-4 opacity-0 -translate-x-2 group-hover/item:opacity-1 group-hover/item:translate-x-0 transition-all duration-200 text-slate-400" />
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Column 3: High-Quality Editorial Brand Image Card */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 group flex flex-col justify-end p-6 min-h-60 shadow-sm border border-slate-100">
                     <img
                        src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80"
                        alt="Summer Editorial Campaign"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                     />
                     {/* Overlay shading gradient for text readability */}
                     <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                     <div className="relative z-10 text-white">
                        <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 backdrop-blur-xs px-2 py-1 rounded-sm">
                           Summer Campaign
                        </span>
                        <h5 className="text-xl font-bold tracking-tight mt-3 mb-1">
                           The Art of Minimalist Dressing
                        </h5>
                        <p className="text-xs text-slate-300 font-medium mb-3">
                           Explore lightweight textures curated for effortless daily luxury.
                        </p>
                        <a
                           href="#"
                           className="text-xs font-semibold flex items-center gap-1 hover:underline w-fit"
                        >
                           View Editorial <span className="text-sm">→</span>
                        </a>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
