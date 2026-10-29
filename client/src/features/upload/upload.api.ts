// upload.api.ts

// import { api } from "@/api/axios";
import { api } from "@/lib/axios";

export type UploadResourceType =
  | "shop_logo"
  | "shop_banner"
  | "product_image"
  | "category_image"
  | "return_evidence";

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

export const getUploadSignatureRequest = async (
  resourceType: UploadResourceType,
  resourceId: string,
  mimeType: string
): Promise<UploadSignatureResponse> => {
  const normalizedMimeType =
    mimeType === "image/jpg" ? "image/jpeg" : mimeType;

  const { data } = await api.get("/uploads/signature", {
    params: {
      resourceType,
      resourceId,
      mimeType: normalizedMimeType,
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
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.error?.message || "Failed to upload image");
  }

  return response.json();
};
