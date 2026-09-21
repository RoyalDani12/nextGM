// upload.api.ts

import { api } from "@/api/axios";

export type UploadResourceType =
  | "shop_logo"
  | "shop_banner"
  | "product_image";

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

export const getUploadSignatureRequest = async (
  resourceType: UploadResourceType,
  shopId: string,
  mimeType: string
): Promise<UploadSignatureResponse> => {
  const { data } = await api.get("/uploads/signature", {
    params: {
      resourceType,
      resourceId: shopId,
      mimeType,
    },
  });

  return data.data;
};


export const uploadToCloudinary = async (
  file: File,
  signatureData: UploadSignatureResponse
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("signature", signatureData.signature);
  formData.append("folder", signatureData.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return response.json();
};