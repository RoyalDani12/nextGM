import { Request,Response,NextFunction } from "express";
import { AppError } from "./appError.js";
import { ZodType } from "zod";


export const validate =(schema:ZodType)=>{
   return(req:Request,res:Response,next:NextFunction)=>{
    const  result = schema.safeParse({ body:req.body })

     if(!result.success){
      const errors = result.error.issues.map((e)=>({
        field:e.path.join("."),
        message:e.message
      }))

      return next( new AppError(JSON.stringify(errors),400))
     }
     next()
   }
}