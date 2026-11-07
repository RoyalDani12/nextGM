import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import Hero from "./Hero";

export const Home = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-clip">
      <MarketplaceNavbar />
      <div className="flex-1 w-full">
        <Hero />
      </div>
      <Footer />
    </div>
  );
};