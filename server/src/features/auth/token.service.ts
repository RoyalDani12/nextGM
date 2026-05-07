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