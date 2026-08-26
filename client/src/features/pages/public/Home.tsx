import React from 'react'
import Hero from "@/features/pages/public/Hero";
// import { PublicNavbar } from '@/components/layout/marketplace/PublicNavbar';
import Footer from './Footer';
// import { NavbarRoot } from '@/layouts/NavbarRoot';
import { MarketplaceNavbar } from '@/layouts/MarketplaceNavbar';

export const Home = () => {
  return (
    <div>
      <MarketplaceNavbar/>
      <Hero/>
      <Footer/>
      </div>
  )
}
