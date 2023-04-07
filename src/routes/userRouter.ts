import {Request, Response} from "express";
import { register, provideAuthHash } from "../controllers/userControllers";

const express = require("express")
const router = express.Router();

router.post("/register/", async(req: Request, res: Response) => {
  try {
    var resData = await register(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /user/register/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})


router.post("/provideAuthHash/", async(req: Request, res: Response) => {
  try {
    var resData = await provideAuthHash(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /user/provideAuthHash/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})

export { router as userRouter}