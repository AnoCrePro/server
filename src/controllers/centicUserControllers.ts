import UserCached, { IUserCached } from "../models/UserCachedSchema";
import { Request } from "express";
import CenticUser, { ICenticUser } from "../models/CenticUserSchema";
import OtherNode, { IOtherNode } from "../models/OtherNodeSchema";
import MerkleTree, { IMerkleTree } from "../models/MerkleTreeSchema"
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
  var data: any = await UserLeaf.find({level: 1})
  return data.length
}

async function getNumberOfMerkleTreeInfo() {
  return await MerkleTree.count({})
}

async function hashData(left: string, right: string){
  var mimc = await mimc7()
  var hash = mimc.multiHash([left, right], 0)
  return mimc.F.toObject(hash).toString()
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
        let position = (user_leaf_num + 1) % 2 == 0 ? 1 : 0
        var newUserLeaf = new UserLeaf({
          _id:  user_leaf_num + 1,
          auth_hash: data.auth_hash,
          credit_score: data.credit_score,
          timestamp: data.timestamp,
          hash: data.hash,
          public_key: data.public_key,
          parent: "",
          position: position,
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
  var msg = await buildMerkleTree()
  await UserCached.deleteMany({})

  return msg
}

async function buildMerkleTree() {
  var user_leaf_data = await UserLeaf.find({level: 1}).sort({_id: "ascending"})
  var cur_merkle_tree_number = await getNumberOfMerkleTreeInfo()
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
        let position = Math.ceil(i /2) % 2  == 0 ? 0 : 1
        if (curParent == "") {
          try {
            let otherNodeData = {
              _id: parentId,
              hash: parentHash,
              parent: "",
              level: level, 
              position: position,
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
    // Update Merkle Tree Info 
    var curMerkleTree: IMerkleTree | null = await MerkleTree.findOne({_id: cur_merkle_tree_number})
    if(curMerkleTree == null || curMerkleTree.root != hashes[0].hash) {
      let newMerkleTreeData = {
        _id: cur_merkle_tree_number + 1,
        root: hashes[0].hash,
        level: hashes[0].level,
        number_of_leaf: user_leaf_data.length,
        timestamp: Math.round(Date.now() / 1000).toString()
      }

      var newMerkleTree = new MerkleTree(newMerkleTreeData)

      await newMerkleTree.save()
      console.log("Build new merkle tree successfully")
    } else {
      throw Error("Merkle Tree: Root hash doesn't change!")
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

      var hash = mimc.multiHash([auth_hash, centicUserCheck.credit_score, centicUserCheck.timestamp], 0)
      hash = mimc.F.toObject(hash).toString()
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

async function getInfo(req: Request){
  var data: any = req.body
  var public_key: string = data.public_key
  var siblings: any= []
  var credit_score: number = 0
  var timestamp: string = ""

  var userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: public_key})
  if(userLeafCheck != null) {
    credit_score = userLeafCheck.credit_score
    timestamp = userLeafCheck.timestamp

    var curNode: IUserLeaf | IOtherNode = userLeafCheck
    while(curNode.parent != "") {
      var siblingsNodeList: IOtherNode[] | null = await OtherNode.find({parent: curNode.parent})
      if(siblingsNodeList.length == 1) {
        siblings.push([curNode.hash, curNode.position]) 
      } else {
        for(let i = 0; i < siblingsNodeList.length; ++i) {
          if(siblingsNodeList[i].hash != curNode.hash) {
            siblings.push([siblingsNodeList[i].hash, siblingsNodeList[i].position])
          }
        }
      }
      
      var nextNode: IOtherNode | null = await OtherNode.findOne({_id: curNode.parent})
      if(nextNode != null) {
        curNode = nextNode
      } else {
        throw Error("Get User Leaf Info: Find Next Node Fail !")
      }
    }
    return {
      credit_score: credit_score,
      timestamp: timestamp,
      siblings: siblings
    }
  }
  else {
    throw Error("Get User Leaf Info: Fail!")
    return {}
  }
}

export {register, provideAuthHash, convertCachedToLeaf, buildMerkleTree, getInfo}
