import Hero from "@/features/pages/public/Hero";
import Footer from './Footer';
import { MarketplaceNavbar } from '@/layouts/MarketplaceNavbar';

export const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar/>
      <Hero/>
      <Footer/>
    </div>
  )
}
