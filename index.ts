
import * as dotenv from "dotenv"
import { connectMongoDB } from "./connect"
import { centicUserRouter } from "./src/routes/centicUserRouter"
import { merkleTreeRouter } from "./src/routes/merkleTreeRouter"
import { bankUserRouter } from "./src/routes/bankUserRouter"
import { authRouter } from "./src/routes/authRouter"
import { servicesRouter } from "./src/routes/servicesRouter"

const express = require("express")
const cors = require("cors")
const json = require("body-parser")
dotenv.config()
var app = express()
const port = process.env.PORT

app.use(json())
app.use(cors({origin: '*'}))
app.use("/centic/user", centicUserRouter)
app.use("/centic/merkletree", merkleTreeRouter)
app.use("/centic/auth", authRouter)
app.use("/centic/services", servicesRouter)

app.use("/bank/user", bankUserRouter)


app.get("/", async(req: any, res: any) => {
  res.send("AnoCrePro")
})

app.listen(port, async() => {
  connectMongoDB()
})