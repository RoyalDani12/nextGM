export interface AccessTokenPayload {
  userId: string;
  role: string;
  iat: number; 
  exp: number;
}