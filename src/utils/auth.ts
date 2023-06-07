const jwt = require("jsonwebtoken");

export async function verifyToken (token: any) {
  try {
    const res = await jwt.verify(token, process.env.SECRET_KEY);
    return {
      ...res,
      valid: true,
    };
  } catch (errr) {
    return {
      valid: false,
    };
  }
};

export async function hashString (message: any) {
  const Crypto = require("crypto-js");
  return Crypto.SHA256("test").toString(Crypto.enc.Hex);
};

export async function verifyHash (message: any, hash: any) {
  return hash === hashString(message);
};
