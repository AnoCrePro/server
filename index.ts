
import * as dotenv from "dotenv"
import { connectMongoDB } from "./connect"
import { userRouter } from "./src/routes/userRouter"

const express = require("express")
const cors = require("cors")
const json = require("body-parser")
dotenv.config()
var app = express()
const port = process.env.PORT

app.use(json())
app.use(cors())
app.use("/user", userRouter)

app.get("/", async(req: any, res: any) => {
  res.send("AnoCrePro")
})

app.listen(port, async() => {
  connectMongoDB()
})