import { Outlet } from "react-router-dom";
// import { PublicNavbar } from "./layout/marketplace/PublicNavbar"; // Adjust path
import { PublicNavbar } from "./marketplace/PublicNavbar";

export const PublicLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <PublicNavbar />
            <main className="flex-grow">
                <Outlet /> {/* This is where your page content will render */}
            </main>
        </div>
    );
};