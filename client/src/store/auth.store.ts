import { create } from "zustand"

interface User {
  id:string;
  name:string;
  email:string;
  role:string;
  avatarUrl?: string;
}

interface AuthState {
  user :User | null;
  accessToken :string | null;
  isAuthenticated : boolean;
   isInitializing: boolean;
  //  avatarUrl:string || null;

  setAuth :(user:User,accessToken:string)=>void;
  clearAuth:() =>void;
   setInitializing: (value: boolean) => void;
}


export const useAuthStore = create<AuthState>((set)=>({
  user:null,
  accessToken:null,
  isAuthenticated:false,
  isInitializing: true,

  setAuth:(user,accessToken)=> 
    set({user,accessToken,isAuthenticated:true }),

  clearAuth:()=>
    set({ user:null,accessToken:null, isAuthenticated:false}),

   setInitializing: (value) => set({ isInitializing: value })
}))