
export interface ProfileDetails {
  id: string;
  userId: string;
  phone?: string | null;
  avatar?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    profile?:ProfileDetails;
}

export interface Session {
    id: string;
    deviceName: string;
    ipAddress: string;
    createdAt: string;
    expiresAt: string;
    isCurrentSession: boolean;
}

// Payloads (Data sent to the backend)
export interface UpdateProfilePayload {
    name?: string;
    avatar?: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface DeactivatePayload {
    password?: string; // Adjust if your schema requires password confirmation
}

export interface DeleteAccountPayload {
    password: string; 
}

// Responses (Data received from the backend)
export interface BaseResponse {
    success: boolean;
    message: string;
}

export interface GetMeResponse extends BaseResponse {
    data: UserProfile;
}

export interface GetSessionsResponse extends BaseResponse {
    data: Session[];
}

export interface UploadSignatureResponse extends BaseResponse {
    data: {
        url: string;
        signature: string;
        timestamp: number;
    };
}
