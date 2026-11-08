import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useGetMe, useUpdateProfile, useUploadSignature } from "../users/users.hook";
import { updateProfileSchema, type UpdateProfileFormValues } from "../users/user.schema";
import { uploadAvatarToCloudinary } from "./profile.cloudinary";

export default function ProfileSection() {
  const { data: user, isLoading: isFetchingUser } = useGetMe();
  const { mutate: updateProfile, isPending: isUpdating, isSuccess, error } = useUpdateProfile();
  const { mutateAsync: getUploadSignature, isPending: isSigning } = useUploadSignature();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.profile?.avatar || "",
      phone: user?.profile?.phone || "",
      address: user?.profile?.address || "",
      city: user?.profile?.city || "",
      country: user?.profile?.country || "",
    },
    values: {
      name: user?.name || "",
      avatar: user?.profile?.avatar || "",
      phone: user?.profile?.phone || "",
      address: user?.profile?.address || "",
      city: user?.profile?.city || "",
      country: user?.profile?.country || "",
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const signatureData = await getUploadSignature();
      const cloudinaryResponse = await uploadAvatarToCloudinary(file, signatureData);

      form.setValue("avatar", cloudinaryResponse.secure_url, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    }
  };

  function onSubmit(data: UpdateProfileFormValues) {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    );

    updateProfile(payload);
  }

  if (isFetchingUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-orange-500" />
      </div>
    );
  }

  const errorMessage = error ? (error as any)?.response?.data?.message : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Success Feedback Banner */}
        {isSuccess && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-medium">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Profile details updated successfully.</span>
          </div>
        )}

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium">
            <AlertCircle className="size-4 text-rose-600 shrink-0" />
            <span className="break-all">{typeof errorMessage === "string" ? errorMessage : "Failed to update profile."}</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100">
          <Avatar className="size-16 ring-1 ring-slate-200 shadow-xs shrink-0">
            <AvatarImage src={form.watch("avatar") || user?.profile?.avatar || ""} alt="Profile picture" />
            <AvatarFallback className="bg-orange-50 text-orange-700 text-base font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs rounded-md border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                disabled={isSigning}
                onClick={() => fileInputRef.current?.click()}
              >
                {isSigning ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Upload className="size-3.5 mr-1.5 text-slate-500" />}
                {isSigning ? "Uploading..." : "Change photo"}
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              JPG, PNG or WEBP up to 2MB. Square 256×256px recommended.
            </p>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-slate-700">Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane Doe"
                    {...field}
                    className="h-9 text-xs rounded-md border-slate-200 bg-white focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          {/* Email Address (Disabled) */}
          <FormItem className="space-y-1.5">
            <FormLabel className="text-xs font-medium text-slate-700">Email Address</FormLabel>
            <FormControl>
              <Input
                value={user?.email || ""}
                disabled
                className="h-9 text-xs rounded-md border-slate-200 bg-slate-50/80 text-slate-500 cursor-not-allowed"
              />
            </FormControl>
            <FormDescription className="text-[11px] text-slate-400">
              Primary email address is managed via authentication.
            </FormDescription>
          </FormItem>

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-slate-700">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    {...field}
                    value={field.value || ""}
                    className="h-9 text-xs rounded-md border-slate-200 bg-white focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-slate-700">Street Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 Market St, Suite 400"
                    {...field}
                    value={field.value || ""}
                    className="h-9 text-xs rounded-md border-slate-200 bg-white focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-slate-700">City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="San Francisco"
                    {...field}
                    value={field.value || ""}
                    className="h-9 text-xs rounded-md border-slate-200 bg-white focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-slate-700">Country</FormLabel>
                <FormControl>
                  <Input
                    placeholder="United States"
                    {...field}
                    value={field.value || ""}
                    className="h-9 text-xs rounded-md border-slate-200 bg-white focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Profile changes reflect immediately across your store and purchases.
          </p>
          <Button
            type="submit"
            disabled={isUpdating || !form.formState.isDirty}
            className="h-8.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUpdating && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
