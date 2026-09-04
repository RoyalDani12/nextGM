import React from "react";
import { 
  ShoppingBag, 
  Search, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Package, 
  TrendingUp, 
  Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-background py-16 md:py-24 border-b border-border">
      
      {/* Custom keyframes for sleek product ticker/glow animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 5s ease-in-out infinite;
          }
        `}
      </style>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Amazon-Style Marketplace Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium gap-2">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              The Multi-Vendor Global Marketplace Hub
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              Everything you want, <br />
              <span className="text-primary">delivered from millions of stores.</span>
            </h1>

            <p className="hidden sm:block text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Explore thousands of independent merchant storefronts under one unified marketplace. Fast checkout, prime shipping, and infinite product variety.
            </p>

            {/* Marketplace Search Bar (Amazon Style) */}
            <div className="max-w-xl mx-auto lg:mx-0 flex items-center gap-2 bg-card p-2 rounded-xl border border-border shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search products, brands, or store slugs..." 
                  className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button size="lg" className="px-6 rounded-lg font-medium">
                Search
              </Button>
            </div>

            {/* Trust Metrics */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Buyer Protection Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span>Global Express Delivery</span>
              </div>
            </div>

          </div>

          {/* Right Column: Shadcn Card Grid Marketplace Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative w-full max-w-md mx-auto aspect-square grid grid-cols-2 gap-4">
              
              {/* Product Card 1 */}
              <Card className="shadow-lg border-border animate-float flex flex-col justify-between">
                <CardContent className="p-4 space-y-3">
                  <div className="h-28 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-semibold">
                    Electronics
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">nexus-tech.store</p>
                    <p className="text-sm font-bold text-foreground">Wireless Pro Buds</p>
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <Star className="h-3 w-3 fill-amber-500" /> 4.9 (1.2k)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Card 2 */}
              <Card className="shadow-lg border-border animate-float [animation-delay:2s] flex flex-col justify-between mt-6">
                <CardContent className="p-4 space-y-3">
                  <div className="h-28 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-semibold">
                    Apparel
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">urban-threads.store</p>
                    <p className="text-sm font-bold text-foreground">Streetwear Hoodie</p>
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <Star className="h-3 w-3 fill-amber-500" /> 4.8 (850)
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;