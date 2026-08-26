export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}
export interface ForgetPayload {
    email:string
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

export interface LoginResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        accessToken: string;
        user: AuthUser;
    };
}

// handles the ACCOUNT_DEACTIVATED case your backend returns with 200,
// not an error — same endpoint, two shapes
export interface DeactivatedResponse {
    success: boolean;
    statusCode: number;
    message: string;
    code: "ACCOUNT_DEACTIVATED";
    reactivationKey: string;
}

export interface RegisterResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        user: { id: string; name: string; email: string };
    };
}

export const isDeactivatedResponse = (
    response: LoginResponse | DeactivatedResponse,
): response is DeactivatedResponse => {
    return "code" in response && response.code === "ACCOUNT_DEACTIVATED";
};


export interface resetPasswordPayload {
    token:string;
    newPassword:string;
    confirmPassword:string;
}