import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import { createPaymentIntentService,constructStripeEvent,handleStripeWebhookEvent, initiateRefundService } from "./payment.service.js";


export const createPaymentIntentController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { orderId } = req.params as { orderId: string };

    const result = await createPaymentIntentService(orderId, userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Payment intent created successfully.",
        data: result,
    });
});

export const stripeWebhookController = asyncHandler( async ( req:Request,res:Response)=>{
     const signature = req.headers["stripe-signature"]

     if(!signature || typeof signature !== "string"){
        throw new AppError("Missing Stripe signature header.",400)
     }
       // req.body is a raw Buffer here — express.raw() on this route only
     const event = constructStripeEvent(req.body as Buffer,signature)

     await handleStripeWebhookEvent(event)

     res.status(200).json({ received:true})
})

export const initializeRefundController = asyncHandler( async ( req:Request,res:Response)=>{
    const { orderId } = req.params as { orderId:string }

    const result = await initiateRefundService(orderId)

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Refund initiated successfully.",
        data: result,
    });
})