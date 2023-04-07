import UserCached, { IUserCached } from "../models/UserCachedSchema";
import { Request } from "express";
import CenticUser, { ICenticUser } from "../models/CenticUserSchema";
import OtherNode, { IOtherNode } from "../models/OtherNodeSchema";
import { uuid } from "uuidv4"
import * as dotenv from "dotenv";
import UserLeaf, { IUserLeaf } from "../models/UserLeafSchema";
import { mimc7 } from "../utils/crypto"
import { toHexString } from "../utils/others";

dotenv.config();

async function getNumberOfUserCached() {
  return await UserCached.count({})
}

async function getNumberOfUserLeaf() {
  return await UserLeaf.count({})
}

async function hashData(left: string, right: string){
  var mimc = await mimc7()
  return toHexString(mimc.multiHash([left, right], 0))
}

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

async function convertCachedToLeaf() {
  var user_leaf_num = await getNumberOfUserLeaf()
  var user_cached_data = await UserCached.find({})
  
  user_cached_data.map(async (data) => {
    var userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: data.public_key})
    if( userLeafCheck == null ) {
      try {
        var newUserLeaf = new UserLeaf({
          _id:  user_leaf_num + 1,
          auth_hash: data.auth_hash,
          credit_score: data.credit_score,
          timestamp: data.timestamp,
          hash: data.hash,
          public_key: data.public_key,
          parent: "",
          level: 1,
        })
        user_leaf_num = user_leaf_num + 1

        await newUserLeaf.save()
      } catch (err) {
        console.log("Convert " + data.public_key + " fail!")
      }
    } else {
      console.log("User Leaf " + data.public_key + " is existed!")
    }
  })

  await UserCached.deleteMany({})
}

async function buildMerkleTree() {
  var user_leaf_data = await UserLeaf.find({level: 1}).sort({_id: "ascending"})
  if(user_leaf_data.length > 0) {
    var hashes = user_leaf_data.map(x => x)
    var level = 1

    // Build parents on each level
    while (hashes.length > 1) {
      level = level + 1 
      let childArray: Array<any> = []

      for (let i = 0; i < hashes.length; i += 2) {
        let left = hashes[i]
        let right = i == hashes.length - 1 ? hashes[i] : hashes[i + 1]

        let parentHash = await hashData(left.hash, right.hash)
      
        let curParent = left.parent

        // Add new parent if not existed
        let parentId = uuid().toString()
        if (curParent == "") {
          try {
            let otherNodeData = {
              _id: parentId,
              hash: parentHash,
              parent: "",
              level: level
            }
            childArray.push(otherNodeData)
            var newOtherNode = new OtherNode(otherNodeData)

            await newOtherNode.save()
          }
          catch(err) {
            throw Error ("Build other node on level " + level + " failed!")
          }
        }
        // update parent
        else {
          var oldOtherNode: IOtherNode | null = await OtherNode.findOne({_id: curParent})
          oldOtherNode?.overwrite({hash: parentHash})
          let otherNodeData = {
            _id: oldOtherNode?._id,
            hash: parentHash,
            parent: oldOtherNode?.parent,
            level: level
          }
          childArray.push(otherNodeData)
          await oldOtherNode?.save()
        }

        // update child
        if(level == 2) {
          if(left.parent == "") {
            await UserLeaf.findOneAndUpdate({_id: left._id}, {parent: parentId})
          }
          if(right.parent == "") {
            await UserLeaf.findOneAndUpdate({_id: right._id}, {parent: parentId})
          }
        } else {
          if(left.parent == "") {
            await OtherNode.findOneAndUpdate({_id: left._id}, {parent: parentId})
          }
          if(right.parent == "") {
            await OtherNode.findOneAndUpdate({_id: right._id}, {parent: parentId})
          }
        }
      }

      hashes = childArray.map(x => x)
    }
    return hashes[0].hash
  } else {
    throw Error("There are not User Leafs!")
  }
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

      if(user_cached_num + 1 == 10) {
        convertCachedToLeaf()
      }

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

export {register, provideAuthHash, convertCachedToLeaf, buildMerkleTree}
