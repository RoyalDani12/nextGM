import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store } from "lucide-react";
import { createShopSchema, type CreateShopFormValues } from "./shop.schema";
import { useCreateShop } from "./shop.hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateShopPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<CreateShopFormValues>({
        resolver: zodResolver(createShopSchema),
    });
    const createShop = useCreateShop();

    const onSubmit = (values: CreateShopFormValues) => createShop.mutate(values);

    return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
            <div className="w-full max-w-sm text-center">
                <div className="size-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Store className="size-6 text-indigo-600" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900 mb-1">Start selling on Nexions</h1>
                <p className="text-sm text-slate-500 mb-6">Give your shop a name to get started.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="text-left space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Shop name</Label>
                        <Input id="name" placeholder="e.g. Nat Spare Parts" {...register("name")} />
                        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                    </div>

                    {createShop.isError && (
                        <p className="text-sm text-red-600">
                            {(createShop.error as any)?.response?.data?.message ?? "Something went wrong."}
                        </p>
                    )}

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={createShop.isPending}>
                        {createShop.isPending ? "Creating shop..." : "Create shop"}
                    </Button>
                </form>
            </div>
        </div>
    );
}