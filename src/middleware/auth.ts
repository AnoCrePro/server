const { verifyToken } = require("../utils/auth");

export async function verifyTk(req: any, res: any, next: any) {
  if (!req.headers.authorization) {
    res.json({
      valid: false,
      err: "No token found",
    });
  } else {
    const result = await verifyToken(req.headers.authorization);
    if (result.valid) {
      req.body.userData = result;
      next();
    } else {
      res.status(400);
      res.json({
        valid: false,
        err: "Invalid token",
      });
    }
  }
}
