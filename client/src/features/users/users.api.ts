import { api } from "../../lib/axios";
import type { ChangePasswordPayload, Session, UpdateProfilePayload, UserProfile } from "./user.types";
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

export const changePasswordRequest = async (payload: ChangePasswordPayload) => {
    const { data } = await api.patch("/users/me/change-password", payload);
    return data;
};

export const getSessionsRequest = async (): Promise<Session[]> => {
    const { data } = await api.get("/users/me/sessions");
    return data.data;
};

export const revokeSessionRequest = async (sessionId: string) => {
    const { data } = await api.delete(`/users/me/sessions/${sessionId}`);
    return data;
};

export const revokeOtherSessionsRequest = async () => {
    const { data } = await api.delete("/users/me/sessions");
    return data;
};
