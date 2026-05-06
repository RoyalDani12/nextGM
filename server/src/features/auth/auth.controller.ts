import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";
import { registerService ,verifyEmailService} from "./auth.services.js";

export const registerController = asyncHandler(async (req: Request, res: Response) => {

   const { name, email, password } = req.body; 

  const { user } = await registerService({ name, email, password });

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "Registration successful. Please check your email to verify your account.",
    data: { user }                        
  });

});


// verify email controller
export const verifyEmailController = asyncHandler(async(req:Request,res:Response)=>{

   const { token } = req.query as { token :string}
  const response = await verifyEmailService(token)

  res.status(200).json({
    success:true,
    statusCode:200,
    message:"Email verify Successfully",
    response
  })

})