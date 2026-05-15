import { prisma } from "../../config/db.js";
import { UpdateProfileDto } from "./user.types.js";

export const getUserProfile = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            profile: {
                select: {
                    phone: true,
                    avatar: true,
                    address: true,
                    city: true,
                    country: true,
                },
            },
        },
    });
};


// find user by id 

export const findUserById = async(userId:string)=>{
    return prisma.user.findUnique({
        where:{ id:userId},
        include:{
            profile:true
        }
    })
}

export const  updateUserProfileRepository = async(userId:string,data:UpdateProfileDto)=>{
    const { name,city,address,country,avatar,phone } = data
    return prisma.user.update({
        where: {id:userId },
        data:{
            name:name,
            profile:{
                upsert:{
                    create:{
                        phone,
                        avatar,
                        address,
                        city,
                        country
                    },
                    update:{
                        phone,
                        avatar,
                        address,
                        city,
                        country
                    }
                }
            }
        },
        select:{
            id:true,
            name:true,
            email:true,
            profile:true
        }
    })
}