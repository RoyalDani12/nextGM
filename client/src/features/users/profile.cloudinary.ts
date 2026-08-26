 import axios from "axios";
interface CloudinarySignature {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

export const uploadAvatarToCloudinary = async (
  file: File,
  signatureData: CloudinarySignature
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append(
    "timestamp",
    String(signatureData.timestamp)
  );
  formData.append("folder", signatureData.folder);
  formData.append("signature", signatureData.signature);

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    formData
  );

  return data;
};