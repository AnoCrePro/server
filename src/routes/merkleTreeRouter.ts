import {Request, Response} from "express";
import { getMerkleTreeInfo } from "../controllers/merkleTreeControllers";

const express = require("express")
const router = express.Router();

router.post("/info/", async(req: Request, res: Response) => {
  try {
    var resData = await getMerkleTreeInfo()
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /merkletree/info", err)
    return res.status(404).json({err: (err as Error).message})
  }
})


export { router as merkleTreeRouter}