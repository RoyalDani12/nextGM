import express from "express"
const app = express()


let PORT:number = 5000
app.listen(PORT,()=>{
  console.log(`server connected and running on port ${PORT}`)
})