import {Request, Response} from "express";
import { register, provideAuthHash, buildMerkleTree, convertCachedToLeaf, getInfo, getRegisterInfo, updateRegisterInfo, checkUserLeaf } from "../controllers/centicUserControllers";

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

router.post("/registerInfo/", async(req: Request, res: Response) => {
  try {
    var resData = await getRegisterInfo(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/registerInfo/", err)
    return res.status(201).json({err: (err as Error).message})
  }
})

router.post("/updateRegisterInfo/", async(req: Request, res: Response) => {
  try {
    var resData = await updateRegisterInfo(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/updateRegisterInfo/", err)
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

router.post("/info/", async(req: Request, res: Response) => {
  try {
    var resData = await getInfo(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/info/", err)
    return res.status(404).json({err: (err as Error).message})
  }
})


router.post("/checkUserLeaf/", async(req: Request, res: Response) => {
  try {
    var resData = await checkUserLeaf(req)
    return res.status(201).json(resData)
  } catch (err) {
    console.log("Error: POST /centic/user/checkUserLeaf/", err)
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

export { router as centicUserRouter}