declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        passwordChangedAt: Date | string | null
      };
      shop?:{
        id:string
        ownerId:string
      }
    }
  }
}

export {};