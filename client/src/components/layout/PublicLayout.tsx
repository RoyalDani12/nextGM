import { Outlet } from "react-router-dom";
// import { PublicNavbar } from "./layout/marketplace/PublicNavbar"; // Adjust path
import { MarketplaceNavbar } from "@/features/marketplace/layouts/MarketplaceNavbar";

export const PublicLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <MarketplaceNavbar />
            <main className="flex-grow">
                <Outlet /> {/* This is where your page content will render */}
            </main>
        </div>
    );
};
