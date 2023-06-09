import { Request, Response } from "express";

const express = require("express");
const { verifyTk } = require("../middleware/auth");
const { getDBConnection } = require("../db/index");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { verifyApiKey } = require("../utils/service");
const Crypto = require("crypto-js");
const jwt = require("jsonwebtoken");

const centicAppUrl = "http://178.128.93.195:3001";
router.post("/createKey", verifyTk, async (req: Request, res: Response) => {
  try {
    const { userData } = req.body;
    const { condition, operator, keyName } = req.body;
    const db = await getDBConnection();
    const collection = db.collection("centic-services-api-keys");
    const nodeCrypto = require("crypto");
    const prefix = nodeCrypto.randomBytes(8).toString("hex");
    const newApiKey = nodeCrypto.randomBytes(16).toString("hex");
    const encryptedKey = await Crypto.AES.encrypt(
      newApiKey,
      process.env.ENCRYPTKEY
    ).toString();
    const updatedResult = collection.insertOne({
      key_id: prefix,
      key: encryptedKey,
      userId: userData.userId,
      scope: "all",
      status: "active",
      condition: condition,
      operator: operator,
      keyName: keyName,
      createDate: Date.now(),
    });
    res.json({
      key: prefix + "." + newApiKey,
      success: true,
    });
  } catch (err: any) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});
router.get("/getAllKey", verifyTk, async (req: Request, res: Response) => {
  try {
    const { userData } = req.body;
    const db = await getDBConnection();
    const collection = db.collection("centic-services-api-keys");
    const userId = userData.userId;
    const allKeyData = (
      await collection.find({ userId: userId }).toArray()
    ).map((item: any) => {
      return {
        key_id: item["key_id"],
        name: item.keyName,
        condition: item.condition,
        operator: item.operator,
        createDate: item.createDate,
        status: item.status,
      };
    });
    res.status(200);
    res.send(allKeyData);
  } catch (err: any) {
    res.status(400);
    res.send(err.message);
  }
});
router.get("/getKey", verifyTk, async (req: Request, res: Response) => {
  try {
    const { key_id } = req.query;
    const db = await getDBConnection();
    const collection = db.collection("centic-services-api-keys");
    const keyData = await collection.findOne({ key_id: key_id });
    const keyDecrypted = Crypto.AES.decrypt(
      keyData.key,
      process.env.ENCRYPTKEY
    ).toString(Crypto.enc.Utf8);
    res.json({ key: key_id + "." + keyDecrypted, success: true });
  } catch (err: any) {
    res.json({ success: false, err: err.message });
  }
});
router.post("/verifyKey", verifyApiKey, (req: Request, res: Response) => {
  res.send("ok");
});
router.post("/revokeKey", verifyTk, async (req: Request, res: Response) => {
  try {
    const { key_id } = req.body;
    if (!key_id) {
      res.status(400);
      res.json({ success: false, message: "No key" });
      res.end();
    }
    const db = await getDBConnection();
    const collection = db.collection("centic-services-api-keys");
    await collection.findOneAndUpdate(
      { key_id: key_id },
      {
        $set: {
          status: "revoked",
        },
      }
    );
    res.status(200);
    res.json({
      success: true,
    });
  } catch (err: any) {
    res.status(400);
    res.json({ success: false, message: err.message });
  }
});

router.get("/createUrl", verifyApiKey, async (req: Request, res: Response) => {
  try {
    const apiKey = req.header("x-apikey");
    const apiKey_id = apiKey ? apiKey.split(".")[0] : undefined;
    const { web2Id } = req.query;
    const token = jwt.sign(
      {
        web2Id: web2Id,
        key_id: apiKey_id,
      },
      process.env.SECRET_KEY,
      { expiresIn: 600 }
    );
    const db = await getDBConnection();
    const keyCollection = db.collection("centic-services-api-keys");
    const userCollection = db.collection("centic-services-user");
    const userKeyData = await keyCollection.findOne({
      key_id: apiKey_id,
    });
    const bankId = (
      await userCollection.findOne({
        id: userKeyData.userId,
      })
    )?.bankId;
    const condition = userKeyData.condition;
    res.json({
      url: `${centicAppUrl}/?token=${token}&thirdPartyID=${bankId}&web2ID=${web2Id}&condition=${condition}`,
    });
  } catch (err: any) {
    console.log(err.message);
    res.status(400);
    res.end(err.message);
  }
});
router.post("/verifyUrl", async (req: Request, res: Response) => {
  const { app_url } = req.body;
  const url = require("url");
  const token = url.parse(app_url).query;
  const queryString = require("node:querystring");
  const tempToken = queryString.decode(token).token;
  if (!tempToken) {
    res.status(400);
    res.json({ valid: false, message: "no token" });
    return;
  }
  try {
    const result = await jwt.verify(tempToken, process.env.SECRET_KEY);
    res.status(200);
    res.json({
      valid: true,
    });
  } catch (err: any) {
    res.status(400);
    res.json({ valid: false, message: err.message });
    return;
  }
});

export { router as servicesRouter };
