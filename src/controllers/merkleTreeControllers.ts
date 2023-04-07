import UserLeaf, { IUserLeaf } from "../models/UserLeafSchema";
import * as dotenv from "dotenv";
dotenv.config();

async function test(): Promise<number> {
  return await UserLeaf.count({})
}

export {test}