import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import Hero from "./Hero";

export const Home = () => {
  return (
    <div>
      <MarketplaceNavbar />
      <Hero />
      <Footer />
    </div>
  );
};