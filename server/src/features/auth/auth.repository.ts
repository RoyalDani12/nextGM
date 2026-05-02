import { prisma } from "../../config/db.js";
import { RegisterDto } from "./auth.types.js";

   //  find user by email
export const findUserByEmail = async(email:string)=>{
  return prisma.user.findUnique({
    where: { email }
  })
}

// create user

export const createUser = async(data:RegisterDto & { hashedPassword:string })=>{
  return prisma.user.create({
    data:{
      name:data.name,
      email:data.email,
      password:data.hashedPassword
      // role, status, isEmailVerified → DB defaults handle these
    },
    select:{
      id:true,
      name:true,
      email:true,
      createdAt:true
    }
  })
}