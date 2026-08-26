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
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const signatureData = await getUploadSignature();
      const cloudinaryResponse = await uploadAvatarToCloudinary(file, signatureData);

      form.setValue("avatar", cloudinaryResponse.secure_url, { 
        shouldDirty: true, 
        shouldValidate: true 
      });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    }
  };

  function onSubmit(data: UpdateProfileFormValues) {
    // Filter out empty strings so only filled/changed profile sections are transmitted
    const payload = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    );

    updateProfile(payload);
  }

  if (isFetchingUser) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  // Extract custom error messages coming from backend response if applicable
  const errorMessage = error ? (error as any)?.response?.data?.message : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Success Feedback Banner */}
        {isSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="break-all">{typeof errorMessage === 'string' ? errorMessage : "Failed to update profile."}</span>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Avatar className="h-20 w-20 border-2 border-slate-100 shadow-sm">
            <AvatarImage src={form.watch("avatar") || user?.profile?.avatar || ""} alt="Profile picture" />
            <AvatarFallback className="bg-amber-100 text-amber-700 text-xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-2 border-slate-200 text-slate-700"
              disabled={isSigning}
              onClick={() => fileInputRef.current?.click()}
            >
              {isSigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isSigning ? "Preparing..." : "Upload New"}
            </Button>
            <p className="text-xs text-slate-500">
              Recommended size: 256x256px. Max 2MB.
            </p>
          </div>
        </div>

        {/* Fully Responsive Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Full Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-slate-900">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} className="w-full bg-white border-slate-200 focus-visible:ring-amber-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Address (Disabled) */}
          <FormItem className="w-full">
            <FormLabel className="text-slate-900">Email Address</FormLabel>
            <FormControl>
              <Input 
                value={user?.email || ""} 
                disabled 
                className="w-full bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-100" 
              />
            </FormControl>
            <FormDescription className="text-xs text-slate-500">
              Email cannot be changed directly here.
            </FormDescription>
          </FormItem>

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-slate-900">Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+15550000000" {...field} value={field.value || ""} className="w-full bg-white border-slate-200 focus-visible:ring-amber-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-slate-900">Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} value={field.value || ""} className="w-full bg-white border-slate-200 focus-visible:ring-amber-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-slate-900">City</FormLabel>
                <FormControl>
                  <Input placeholder="New York" {...field} value={field.value || ""} className="w-full bg-white border-slate-200 focus-visible:ring-amber-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-slate-900">Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} value={field.value || ""} className="w-full bg-white border-slate-200 focus-visible:ring-amber-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isUpdating || !form.formState.isDirty}
            className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}