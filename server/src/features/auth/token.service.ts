import Jwt from "jsonwebtoken"
import { env } from "../../config/env.js"

// generate access token
export const generateAccessToken  =(userId:string,role:string):string =>{
    return (
      Jwt.sign(
        { userId,role },
         env.JWT_SECRET,
        { expiresIn:"15m"})  // short lived
    )
}


//  generate Refresh token
export const generateRefreshToken =(userId:string):string=>{
  return (
    Jwt.sign(
      { userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn :"7d" }
    )
  )
}


// verify token

export const verifyAccessToken =( token:string)=>{
   try {
    return Jwt.verify(token,env.JWT_SECRET) as { userId :string,role:string }
   } catch (error) {
    return null
   }
}