import {Request, Response} from "express";
import { register, checkLogin, verifyProof } from "../controllers/bankUserControllers";
const express = require("express")
const router = express.Router();

router.post("/register/", async(req: Request, res: Response) => {
  try {
    let resData = await register(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /bank/user/register/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})

router.post("/login/", async(req: Request, res: Response) => {
  try {
    let resData = await checkLogin(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /bank/user/login/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})

router.post("/verify/", async(req: Request, res: Response) => {
  try {
    let resData = await verifyProof(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /bank/user/verify/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})

export { router as bankUserRouter}