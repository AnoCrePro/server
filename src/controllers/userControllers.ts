import UserCached, { IUserCached } from "../models/UserCachedSchema";
import { Request } from "express";
import CenticUser, { ICenticUser } from "../models/CenticUserSchema";
import * as dotenv from "dotenv";
import UserLeaf, { IUserLeaf } from "../models/UserLeafSchema";
import { mimc7 } from "../utils/crypto"
import { toHexString } from "../utils/others";

dotenv.config();

async function register (req: Request) {
  var data: any = req.body
  var name: string = data.name
  var credit_score: number = data.credit_score
  var timestamp: string = data.timestamp
  var public_key: string = data.public_key

  var centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})

  if (centicUserCheck == null) {
    try{
      var newCenticUser = new CenticUser({
        name: name,
        credit_score: credit_score,
        timestamp: timestamp,
        public_key: public_key
      })

      await newCenticUser.save();

      return await CenticUser.findOne({public_key: public_key})
    } 
    catch(err) {
      console.log("Register fail", err)
    }
  }  
  else {
    throw Error("Centic User existed!")
  }
}

async function getNumberOfUserCached() {
  return await UserCached.count({})
}

async function provideAuthHash(req: Request) {
  var data: any = req.body
  var auth_hash: string = data.auth_hash
  var public_key: string = data.public_key

  var mimc = await mimc7()

  var centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})
  var userCachedCheck: IUserCached | null = await UserCached.findOne({public_key: public_key})
  var userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: public_key})

  if (centicUserCheck != null && userCachedCheck == null && userLeafCheck == null) {
    try {
      var user_cached_num = await getNumberOfUserCached()
      var hash = toHexString(mimc.multiHash([auth_hash, centicUserCheck.credit_score, centicUserCheck.timestamp], 0))
      var newUserCached = new UserCached({
        _id: user_cached_num + 1,
        auth_hash: auth_hash,
        credit_score: centicUserCheck.credit_score,
        timestamp: centicUserCheck.timestamp,
        hash: hash,
        public_key: public_key
      })

      await newUserCached.save()

      return await UserCached.findOne({public_key: public_key})
    } catch (err) {
      console.log("Provice Auth Hash fail", console.log(err))
    }
  } else if (centicUserCheck == null) {
    throw Error("Centic User has to register before provide Authentication Hash!")
  } else {
    throw Error("Centic User already provide Authentication Hash before!")
  }
}

export {register, provideAuthHash}
