import { prisma } from "../../config/db.js";
import { RegisterDto } from "./auth.types.js";
import crypto from "crypto"

   //  find user by email
export const findUserByEmail = async(email:string)=>{
  return prisma.user.findUnique({
    where: { email }
  })
}

//  add transaction function that creates user +  verification token together

export const createUserWithVerification =async (
  data:RegisterDto & { hashedPassword:string }
)=>{
      // generate random token
      const rawToken = crypto.randomBytes(32).toString("hex")

      // hash it before storing 

      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")

      const user = await prisma.$transaction( async (tx)=>{
        // create user

        const newUser = await tx.user.create({
          data:{
            name:data.name,
            email:data.email,
            password:data.hashedPassword
          },
          select:{
            id:true,
            name:true,
            email:true,
            createdAt:true
          },
        })

        // create the same verification record in the same transaction
        await tx.emailVerification.create({
          data:{
            userId:newUser.id,
            token:hashedToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        })
        return newUser
      })

       // send raw token in email, store hashed token in DB
      return { user ,rawToken }


}












/* // create user

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
} */