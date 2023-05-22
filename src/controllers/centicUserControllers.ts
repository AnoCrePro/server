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

const web3 = new Web3("https://rpc.sepolia.org")
const merkleTreeAbi = require("../abi/rootabi.json")

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
  let credit_score: number = data.credit_score
  let timestamp: string = data.timestamp
  let public_key: string = data.public_key.toLowerCase()

  let centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})

  if (centicUserCheck == null) {
    try{
      let newCenticUser = new CenticUser({
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

async function updateRegisterInfo (req: Request) {
  let data: any = req.body
  let credit_score: number = data.credit_score
  let timestamp: string = data.timestamp
  let public_key: string = data.public_key

  let centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})

  if (centicUserCheck == null) {
    try{
      let newCenticUser = new CenticUser({
        credit_score: credit_score,
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
        credit_score: credit_score,
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
          credit_score: data.credit_score,
          timestamp: data.timestamp,
          hash: data.hash,
          bank_id: data.bank_id,
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
  await UserCached.deleteMany({})
  let msg = await buildMerkleTree()
  return msg
}

async function buildMerkleTree() {
  let user_leaf_data = await UserLeaf.find({level: 1}).sort({_id: "ascending"})
  console.log(user_leaf_data)
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

    let account = privateKeyToAccount(web3, "d6ca2953383daf0b410de38c6d98ba87b04aaa91aa99d8da903672fd81107c33")
      .then(res => {
        console.log(res)
      })

    let merkleTreeContract = await new web3.eth.Contract(
        merkleTreeAbi,
        "0xC1a907e7dacc7ea005c2F50165e08b44C5096fD9"
      )

    const insertRootFunction = merkleTreeContract.methods.insertRoot(hashes[0].hash)
    await sendSignedTxAndGetResult(account, merkleTreeContract, 0, insertRootFunction, 10.0, web3)
      .then(res => {
        console.log(res)
      })

    
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
  let bank_id: string = data.bank_id
  let mimc = await mimc7()

  let centicUserCheck: ICenticUser | null = await CenticUser.findOne({public_key: public_key})
  let userCachedCheck: IUserCached | null = await UserCached.findOne({public_key: public_key})
  let userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: public_key})

  if (centicUserCheck != null && userCachedCheck == null && userLeafCheck == null) {
    try {
      let user_cached_num = await getNumberOfUserCached()

      let hash = mimc.multiHash([auth_hash, centicUserCheck.credit_score, centicUserCheck.timestamp], 0)
      hash = mimc.F.toObject(hash).toString()
      let newUserCached = new UserCached({
        _id: user_cached_num + 1,
        auth_hash: auth_hash,
        credit_score: centicUserCheck.credit_score,
        timestamp: centicUserCheck.timestamp,
        bank_id: bank_id,
        hash: hash,
        public_key: public_key
      })

      await newUserCached.save()

      if(user_cached_num + 1 >= 1) {
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
  let data: any = req.body
  let public_key: string = data.public_key
  let siblings: any= []
  let direction: any=[]
  let credit_score: number = 0
  let timestamp: string = ""
  let auth_hash: string = ""
  let bank_id: string = ""
  let root: string = ""

  let userLeafCheck: IUserLeaf | null = await UserLeaf.findOne({public_key: public_key.toLowerCase()})
  if(userLeafCheck != null) {
    credit_score = userLeafCheck.credit_score
    timestamp = userLeafCheck.timestamp
    bank_id = userLeafCheck.bank_id
    auth_hash = userLeafCheck.auth_hash

    var cur_merkle_tree_number = await getNumberOfMerkleTreeInfo()
    var curMerkleTree: IMerkleTree | null = await MerkleTree.findOne({_id: cur_merkle_tree_number})
    if(curMerkleTree != null) {
      root = curMerkleTree.root
    }

    let curNode: IUserLeaf | IOtherNode = userLeafCheck
    while(curNode.parent != "") {
      let siblingsNodeList: IOtherNode[] | null = await OtherNode.find({parent: curNode.parent})
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
    return {
      main_pub: public_key,
      credit_score: credit_score,
      auth_hash: auth_hash,
      root: root,
      timestamp: timestamp,
      direction: direction,
      bank_id: bank_id,
      siblings: siblings
    }
  }
  else {
    throw Error("Get User Leaf Info: Fail!")
  }
}

export {register, updateRegisterInfo, provideAuthHash, convertCachedToLeaf, buildMerkleTree, getInfo, getRegisterInfo}
