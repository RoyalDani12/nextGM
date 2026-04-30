

import rateLimit from "express-rate-limit";

// limiter for all routes
export const generalLimiter = rateLimit({
  windowMs:15 *60 * 1000,
  max:100,                     // max 100 requests per windowMs
  standardHeaders:true,
  legacyHeaders:false,
  message:{
    status:"error",
    message:"Too many requests. Please try again later"
  }
})


// limiter for auth routes
export const authLimiter = rateLimit({
  windowMs:15 *60 * 1000,
  max:10,          // only 10 attempts per 15 min
  message:{
    status:"error",
    message:'Too many login attempts , Please tray again later .'
  }
})


//  API Limiter - for heavy endpoints

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minutes
  max: 30,              // 30 requests per minutes
  message:{
    status:"error",
    message:"API rate limit exceeded"
  }
})