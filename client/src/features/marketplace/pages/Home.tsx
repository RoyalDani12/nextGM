import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import Hero from "./Hero";

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <MarketplaceNavbar />
      <Hero />
      <Footer />
    </div>
  );
};