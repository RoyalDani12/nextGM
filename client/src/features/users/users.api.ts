import { api } from "../../lib/axios"; // Adjust path if your axios instance is elsewhere
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

export interface UpdateProfilePayload {
    name?: string;
    avatarUrl?: string;
}


export const getMeRequest = async (): Promise<UserProfile> => {
    const { data } = await api.get("/users/me");
    return data.data;
};

export const getUploadSignatureRequest = async()=>{
     const { data } = await api.get(
        "/users/me/upload-signature"
     )
     return data.data
}

export const updateProfileRequest = async (payload: UpdateProfilePayload) => {
    const { data } = await api.put("/users/me", payload);
    return data;
};
