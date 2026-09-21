import React from "react";
import Hero from "@/features/pages/public/Hero";
import Footer from "./Footer";
import { MarketplaceNavbar } from "@/layouts/MarketplaceNavbar";

export const Home = () => {
  return (
    <div>
      <MarketplaceNavbar />
      <Hero />
      <Footer />
    </div>
  );
};