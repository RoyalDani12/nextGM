import { redis } from "./redis.client.js";

const SESSION_TTL = 15 * 60  // 15 minutes

interface User {
  id:string
  name:string
  role:string
  email:string
  status:string
}
export const cacheUserSession = async(user:User) =>{

  await redis.set(
    `session:${user.id}`,
    JSON.stringify(user),
    "EX",
    SESSION_TTL
  )

}


// get user session 

export const getUserSession = async (userId: string): Promise<User | null> => {
  try {
    const data = await redis.get(`session:${userId}`);
    if (!data) return null;
    return JSON.parse(data) as User;
  } catch (error) {
    console.error("Redis Cache Error:", error);
    return null; // Fail-safe: if Redis is down, return null to force a DB lookup
  }
};


// delete user session
export const deleteUserSession = async(userId:string)=>{
  await redis.del(`session:${userId}`)
}