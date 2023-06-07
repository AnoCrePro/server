const { getDBConnection } = require("../db/index");

export async function verifyApiKey (req: any, res: any, next: any) {
  const apiKey = req.header("x-apikey");
  if (!apiKey) {
    res.end("No api key");
    return;
  }
  const key_id = apiKey.split(".")[0];
  const key = apiKey.split(".")[1];
  const db = await getDBConnection();
  const collection = db.collection("centic-services-api-keys");
  const keyData = await collection.findOne({ key_id: key_id });
  const Crypto = require("crypto-js");
  const keyDecrypted = Crypto.AES.decrypt(
    keyData.key,
    process.env.ENCRYPTKEY
  ).toString(Crypto.enc.Utf8);
  if (key === keyDecrypted) {
    next();
  } else {
    res.json({
      success: false,
      message: "invalid key",
    });
  }
};