import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CartPage() {
    return (
        <main className="min-h-screen bg-background px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-3xl">
                <Link
                    to="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Continue shopping
                </Link>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                    Your cart
                </h1>
                <Card className="mt-6">
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <ShoppingBag className="size-10 text-muted-foreground" />
                        <div>
                            <h2 className="font-heading text-lg font-semibold">Your cart is empty</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add products from the marketplace to see them here.
                            </p>
                        </div>
                        <Link
                            to="/"
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                        >
                            Explore products
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
