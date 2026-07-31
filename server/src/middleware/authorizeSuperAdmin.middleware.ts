import { Request, Response, NextFunction } from "express";
import { AppError } from "./appError.js";


export const authorizeSuperAdmin = ( req:Request,res:Response,next:NextFunction)=>{
   if(req.user?.role !== "SUPER_ADMIN"){
    throw new AppError("Forbidden.",403)
   }
   next()
}