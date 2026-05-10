

import { prisma } from "../../config/db.js";
import { RegisterDto } from "./auth.types.js";
import crypto from "crypto";
import { Prisma } from "@prisma/client/extension";
import { env } from '../../config/env.js'


//  find user by email
export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
    });
};

//  add transaction function that creates user +  verification token together

export const createUserWithVerification = async (
    data: RegisterDto & { hashedPassword: string },
) => {
    // generate random token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // hash it before storing

    const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const user = await prisma.$transaction(async (tx:Prisma.TransactionClient) => {
        // create user

        const newUser = await tx.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        // create the same verification record in the same transaction
        await tx.emailVerification.create({
            data: {
                userId: newUser.id,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour
            },
        });
        return newUser;
    });

    // send raw token in email, store hashed token in DB
    return { user, rawToken };
};

export const findEmailVerification = async (hashedToken: string) => {
    return prisma.emailVerification.findUnique({
        where: { token: hashedToken },
        include: { user: true }, //grab the user in the same query
    });
};

export const markEmailVerified = async (
    userId: string,
    verificationId: string,
) => {
    return prisma.$transaction(async (tx:Prisma.TransactionClient) => {
        // flip user to active
        await tx.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                status: "ACTIVE",
            },
        });

        // delete the record entirely
        await tx.emailVerification.delete({
            where: { id: verificationId },
        });
    });
};


// save refresh token and last login at

export const saveRefreshTokenAndUpdateLastLogin =async(userId:string,token:string)=>{
    return prisma.$transaction(async (tx)=>{

    // step 1 count existing sessions  to limit the number of  device his is login
      const sessionCount = await tx.refreshToken.count({
        where: { userId }
      })  
    
        if(sessionCount >= env.DEVICE_LIMIT){

            const oldest = await tx.refreshToken.findFirst({
                where:{ userId },
                orderBy: { createdAt :"asc"} // oldest first
            })


            if( oldest) { 
                await tx.refreshToken.delete({
                 where: {id:oldest.id },
              })  
            }
        }
        // save refresh token
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
        await tx.refreshToken.create({
            data:{
                userId,
                token,
                expiresAt: new Date( Date.now() + SEVEN_DAYS_MS)
            }
        })
      
        // save last login
        await tx.user.update({
             where: { id : userId },
             data: {
                lastLoginAt: new Date()
             }
        })
    })
  
}
 


// find refresh token
export const findRefreshToken=async(hashedToken:string)=>{
      return prisma.refreshToken.findFirst({
         where: { token:hashedToken},
        //  include: { user : true } 
      })
}


// find user by id
export const findUserById=async(id:string)=>{
    return prisma.user.findUnique({
        where: { id },
        select :{
            id:true,
            name:true,
            email:true,
            role:true,
            status:true
        }
    })
}

// delete the old token and  create new one
export const rotateRefreshToken = async(
    oldToken:string,
    userId:string,
    newHashedToken:string
)=>{
    return prisma.$transaction( async (tx)=>{
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
        // delete old one
        await tx.refreshToken.delete({
            where: { id : oldToken }
        })

        // create new one
        await tx.refreshToken.create({
            data:{ 
                userId,
                token:newHashedToken,
                expiresAt: new Date( Date.now() + SEVEN_DAYS_MS )
            }
        })
    })
}


export const deleteRefreshToken=async( hashedToken:string)=>{
   return prisma.refreshToken.deleteMany({
    where: { token:hashedToken }
   })
}