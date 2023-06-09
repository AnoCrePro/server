import { Request, Response } from "express";

let express = require("express");
let router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDBConnection } = require("../db/index");
const { hashString, verifyHash, verifyToken } = require("../utils/auth");
const { verifyTk } = require("../middleware/auth");

router.post("/register", async (req: Request, res: Response) => {
  try {
    const userId = uuidv4();
    const { bankId, password, userName } = req.body;
    if (!(bankId && password && userName)) {
      res.json({ success: false, res: "empty" });
      return;
    }

    const db = await getDBConnection();
    const userCollection = db.collection("centic-services-user");
    await userCollection.insertOne({
      userName: userName,
      id: userId,
      bankId: bankId,
      password: await hashString(password),
    });

    res.json({
      success: true,
    });
    return;
  } catch (err: any) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { userName, password } = req.body;
  if (!(userName && password)) {
    res.status(400);
    res.json({
      success: false,
      message: "In valid credential",
    });
  }
  try {
    const db = await getDBConnection();
    const userCollection = db.collection("centic-services-user");
    const userData = await userCollection.findOne({
      userName: userName,
    });
    if (!userData) {
      res.end("user not exist");
      return;
    }
    const validateRes = await verifyHash(password, userData.password);
    if (!validateRes) {
      res.end("wrong password");
      return;
    }
    var jwt = require("jsonwebtoken");
    var token = await jwt.sign(
      {
        userId: userData.id,
        bankId: userData.bankId,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "30d",
      }
    );

    res.json({ token: token });
    return;
  } catch (err: any) {
    res.status(400);
    res.end(err.message);
  }
});
router.get("/verifyToken", verifyTk, async (req: Request, res: Response) => {
  res.status(200);
  res.json({
    valid: true,
  });
});

export { router as authRouter };
