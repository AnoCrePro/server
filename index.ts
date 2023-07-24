import * as dotenv from "dotenv";
import { connectMongoDB } from "./connect";
import { cryptoScanUserRouter } from "./src/routes/cryptoScanUserRouter";
import { merkleTreeRouter } from "./src/routes/merkleTreeRouter";
import { bankUserRouter } from "./src/routes/bankUserRouter";

const express = require("express");
const cors = require("cors");
const json = require("body-parser");
dotenv.config();
var app = express();
const port = process.env.PORT;

app.use(json());
app.use(cors());
app.use("/cryptoscan/user", cryptoScanUserRouter);
app.use("/cryptoscan/merkletree", merkleTreeRouter);
app.use("/bank/user", bankUserRouter);

app.get("/", async (req: any, res: any) => {
  res.send("AnoCrePro");
});

app.listen(port, async () => {
  connectMongoDB();
});
