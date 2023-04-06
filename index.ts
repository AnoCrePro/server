
import * as dotenv from "dotenv"
import { connectMongoDB } from "./connect"
const express = require("express")
const cors = require("cors")
const json = require("body-parser")
dotenv.config()
var app = express()
const port = process.env.PORT

app.use(json())
app.use(cors())

app.get("/", async(req: any, res: any) => {
  res.send("AnoCrePro")
})

app.listen(port, async() => {
  connectMongoDB()
})