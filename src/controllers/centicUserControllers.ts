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
import { sendSignedTxAndGetResult, privateKeyToAccount } from "../utils/trans";
import Web3 from "web3"
import { timeStamp } from "console";



dotenv.config();

async function getNumberOfUserCached() {
  return await UserCached.count({})
}
async function getNumberOfUserLeaf() {
  let data: any = await UserLeaf.find({level: 1})
  return data.length
}

async function getNumberOfMerkleTreeInfo() {
  return await MerkleTree.count({})
}

async function hashData(left: string, right: string){
  let mimc = await mimc7()
  let hash = mimc.multiHash([left, right], 0)
  return mimc.F.toObject(hash).toString()
}


async function register (req: Request) {
  let data: any = req.body
  let balance: number = data.balance
  let timestamp: string = data.timestamp
  let public_key: string = data.public_key.toLowerCase()

  let centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})

  if (centicUserCheck == null) {
    try{
      let newCenticUser = new CenticUser({
        balance: balance,
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
    throw Error("User existed!")
  }
}

async function updateRegisterInfo (req: Request) {
  let data: any = req.body
  let balance: number = data.balance
  let timestamp: string = data.timestamp
  let public_key: string = data.public_key

  let centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})

  if (centicUserCheck == null) {
    try{
      let newCenticUser = new CenticUser({
        balance: balance,
        timestamp: timestamp,
        public_key: public_key
      })

      await newCenticUser.save();

      return await CenticUser.findOne({public_key: public_key})
    } 
    catch(err) {
      console.log(err)
    }
  }  
  else {
    try {
      let centicUser: ICenticUser | null = await CenticUser.findOneAndUpdate({public_key: public_key}, {
        balance: balance,
        timestamp: timestamp,
      }, {new: true})
      let userLeaf: IUserLeaf | null = await UserLeaf.findOneAndUpdate({public_key: public_key}, {
        balance: balance,
        timestamp: timestamp,
      }, {new: true})
      return centicUser
    }
    catch (err) {
      console.log(err)
    }
  }
}

async function convertCachedToLeaf() {
  let start = Date.now();
  let user_leaf_num = await getNumberOfUserLeaf()
  let user_cached_data = await UserCached.find({})
  
  await user_cached_data.map(async (data) => {
    let userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: data.public_key})
    if( userLeafCheck == null ) {
      try {
        let position = (user_leaf_num + 1) % 2 == 0 ? 0 : 1
        let newUserLeaf = new UserLeaf({
          _id:  user_leaf_num + 1,
          auth_hash: data.auth_hash,
          balance: data.balance,
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
  // await UserCached.deleteMany({})
  let msg = await buildMerkleTree()
  let timeTaken = Date.now() - start;
  console.log(timeTaken)
  return msg
}

async function buildMerkleTree() {
  let start = Date.now();
  let user_leaf_data = await UserLeaf.find({level: 1}).sort({_id: "ascending"})
  let cur_merkle_tree_number = await getNumberOfMerkleTreeInfo()
  if(user_leaf_data.length > 0) {
    let hashes = user_leaf_data.map(x => x)
    let level = 1

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
        let position = Math.ceil(i /2) % 2  == 0 ? 1 : 0
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
            let newOtherNode = new OtherNode(otherNodeData)

            await newOtherNode.save()
          }
          catch(err) {
            throw Error ("Build other node on level " + level + " failed!")
          }
        }
        // update parent
        else {
          let oldOtherNode: any= await OtherNode.findOneAndUpdate({_id: curParent}, {hash: parentHash}, {new: true})
          childArray.push(oldOtherNode)
        }

        // update child
        if(level == 2) {
          if(left.parent == "") {
            if(curParent == "") {
              await UserLeaf.findOneAndUpdate({_id: left._id}, {parent: parentId})
            }
            else {
              await UserLeaf.findOneAndUpdate({_id: left._id}, {parent: curParent})
            }
          }
          if(right.parent == "") {
            if(curParent == "") {
              await UserLeaf.findOneAndUpdate({_id: right._id}, {parent: parentId})
            }
            else {
              await UserLeaf.findOneAndUpdate({_id: right._id}, {parent: curParent})
            }
          }
        } else {
          if(left.parent == "") {
            if(curParent == "") {
              await OtherNode.findOneAndUpdate({_id: left._id}, {parent: parentId})
            }
            else {
              await OtherNode.findOneAndUpdate({_id: left._id}, {parent: curParent})
            }
          }
          if(right.parent == "") {
            if(curParent == "") {
              await OtherNode.findOneAndUpdate({_id: right._id}, {parent: parentId})
            }
            else {
              await OtherNode.findOneAndUpdate({_id: right._id}, {parent: curParent})
            }
          }
        }
      }

      hashes = childArray.map(x => x)
    }
    if(hashes[0].level < 16) {
      let curHash = hashes[0].hash
      for(let i = hashes[0].level; i <= 16; ++i) {
        let tempHash = await hashData(curHash, curHash)
        curHash = tempHash;
        hashes[0].level = hashes[0].level + 1;
      }
      hashes[0].hash = curHash
    }
    // Update Merkle Tree Info 
    let curMerkleTree: IMerkleTree | null = await MerkleTree.findOne({_id: cur_merkle_tree_number})
    if(curMerkleTree == null || curMerkleTree.root != hashes[0].hash) {
      let newMerkleTreeData = {
        _id: cur_merkle_tree_number + 1,
        root: hashes[0].hash,
        level: hashes[0].level,
        number_of_leaf: user_leaf_data.length,
        timestamp: Math.round(Date.now() / 1000).toString()
      }

      let newMerkleTree = new MerkleTree(newMerkleTreeData)

      await newMerkleTree.save()

      console.log("Build new merkle tree successfully")
    } else {
      throw Error("Merkle Tree: Root hash doesn't change!")
    }
    let timeTaken = Date.now() - start;
    console.log("Build merkle tree: " + timeTaken)
    return hashes[0].hash
  } else {
    throw Error("There are not User Leafs!")
  }
}

async function getRegisterInfo(req: Request) {
  let data: any = req.body
  let public_key: string = data.public_key

  let centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})

  return centicUserCheck
}

async function provideAuthHash(req: Request) {
  let data: any = req.body
  let auth_hash: string = data.auth_hash
  let public_key: string = data.public_key
  let mimc = await mimc7()

  let centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})
  let userCachedCheck: IUserCached | null = await UserCached.findOne({public_key: public_key})
  let userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: public_key})

  if (centicUserCheck != null && userCachedCheck == null && userLeafCheck == null) {
    try {
      let user_cached_num = await getNumberOfUserCached()

      let hash = mimc.multiHash([auth_hash, centicUserCheck.balance, centicUserCheck.timestamp], 0)
      hash = mimc.F.toObject(hash).toString()
      let newUserCached = new UserCached({
        _id: user_cached_num + 1,
        auth_hash: auth_hash,
        balance: centicUserCheck.balance,
        timestamp: centicUserCheck.timestamp,
        hash: hash,
        public_key: public_key
      })

      await newUserCached.save()

      // if(user_cached_num + 1 >= 1) {
      //   convertCachedToLeaf()
      // }

      return await UserCached.findOne({public_key: public_key})
    } catch (err) {
      console.log("Provice Auth Hash fail", console.log(err))
    }
  } else if (centicUserCheck == null) {
    throw Error("User has to register before provide Authentication Hash!")
  } else {
    throw Error("User already provide Authentication Hash before!")
  }
}

async function getInfo(req: Request){
  let start = Date.now()
  let data: any = req.body
  let public_key: string = data.public_key
  let siblings: any= []
  let direction: any=[]
  let balance: string = "0"
  let timestamp: string = ""
  let auth_hash: string = ""
  let root: string = ""

  let userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: public_key.toLowerCase()})
  if(userLeafCheck != null) {
    balance = userLeafCheck.balance
    timestamp = userLeafCheck.timestamp
    auth_hash = userLeafCheck.auth_hash

    var cur_merkle_tree_number = await getNumberOfMerkleTreeInfo()
    var curMerkleTree: IMerkleTree | null = await MerkleTree.findOne({_id: cur_merkle_tree_number})
    if(curMerkleTree != null) {
      root = curMerkleTree.root
    }

    let curNode: IUserLeaf | IOtherNode = userLeafCheck
    while(curNode.parent != "") {
      let siblingsNodeList: IOtherNode[] | null = await OtherNode.find({parent: curNode.parent})
      if(siblingsNodeList != null) {
        if(siblingsNodeList.length == 1) {
          siblings.push(siblingsNodeList[0].hash)
          direction.push(siblingsNodeList[0].position.toString())
        } else {
          for(let i = 0; i < siblingsNodeList.length; ++i) {
            if(siblingsNodeList[i].hash != curNode.hash) {
              siblings.push(siblingsNodeList[i].hash)
              direction.push(siblingsNodeList[i].position.toString())
            }
          }
        }
      }
      
      
      let nextNode: IOtherNode | null = await OtherNode.findOne({_id: curNode.parent})
      if(nextNode != null) {
        curNode = nextNode
      } else {
        throw Error("Get User Leaf Info: Find Next Node Fail !")
      }
    }
    siblings.push(curNode.hash)
    direction.push("0")
    let curHash = curNode.hash
    while(siblings.length < 16) {
      let tempHash = await hashData(curHash, curHash)
      siblings.push(tempHash)
      direction.push("0")
      curHash = tempHash
    }
    let timeTaken = Date.now() - start;
    console.log("Get info: " + timeTaken)
    return {
      publicKey: public_key,
      balance: balance,
      authHash: auth_hash,
      root: root,
      timestamp: timestamp,
      direction: direction,
      siblings: siblings
    }
  }
  else {
    throw Error("Get User Leaf Info: Fail!")
  }
  
}

async function checkUserLeaf (req: Request){
  let data = req.body
  let public_key = data.public_key

  let userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: public_key.toLowerCase()})
  return userLeafCheck
}

export {register, updateRegisterInfo, provideAuthHash, convertCachedToLeaf, buildMerkleTree, getInfo, getRegisterInfo, checkUserLeaf}
