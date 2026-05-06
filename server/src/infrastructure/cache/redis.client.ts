import { Redis } from 'ioredis'

import { env } from '../../config/env.js'

export const redis = new Redis(env.REDIS_URL,{
  maxRetriesPerRequest:null,

  retryStrategy(times){
    if(times >10 ){
      console.error("Redis to many retries,giving up")
      return null
    }
    return 5000
  }
})

redis.on("connect",()=>{
  console.log("Redis connected")
})

redis.on("error",(err)=>{
  console.error("Redis error:",err.message)
})