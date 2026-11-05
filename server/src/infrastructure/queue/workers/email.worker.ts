import { Job, Worker } from "bullmq";
import { queueRedis } from "../../cache/redis.client.js";
import { sendEmail } from "../../../services/email.transporter.js";


export const emailWorker = new Worker("emails",
  //must match the queue name exactly

   async(job:Job)=>{
    const { to,subject,html } = job.data

    await sendEmail(to, subject, html);

    console.log(`Email sent to ${to} | job: ${job.id}`)
   },
   {
    connection:queueRedis,
    concurrency:5 // process 5 emails at the same time
   }
  )

  // log  when the worker starts
  emailWorker.on("ready",()=>{
    console.log("Email worker ready");
    
  })

  //log completed
  emailWorker.on("completed",(job)=>{
    console.log(`Email job ${job.id}  completed`);
    
  })    
    // log failed jobs
  emailWorker.on("failed",(job,error)=>{
      console.error(`Email job ${job?.id} failed`,error.message)
    })