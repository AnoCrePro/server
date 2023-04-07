import {Request, Response} from "express";
import { register, provideAuthHash, buildMerkleTree, convertCachedToLeaf } from "../controllers/centicUserControllers";

const express = require("express")
const router = express.Router();

router.post("/register/", async(req: Request, res: Response) => {
  try {
    var resData = await register(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/register/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})


router.post("/provideAuthHash/", async(req: Request, res: Response) => {
  try {
    var resData = await provideAuthHash(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/provideAuthHash/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})


router.post("/test/", async(req: Request, res: Response) => {
  try {
    var resData = await buildMerkleTree()
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/test/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})

router.post("/test2/", async(req: Request, res: Response) => {
  try {
    var resData = await convertCachedToLeaf()
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/test/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})

export { router as userRouter}