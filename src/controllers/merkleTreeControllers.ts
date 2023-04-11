import MerkleTree, { IMerkleTree } from "../models/MerkleTreeSchema";
import UserLeaf, { IUserLeaf } from "../models/UserLeafSchema";
import OtherNode, { IOtherNode } from "../models/OtherNodeSchema";
import * as dotenv from "dotenv";
dotenv.config();

async function getNumberOfMerkleTreeInfo() {
  return await MerkleTree.count({})
}

async function getMerkleTreeInfo() {
  var cur_merkle_tree_number = await getNumberOfMerkleTreeInfo()
  var curMerkleTree: IMerkleTree | null = await MerkleTree.findOne({_id: cur_merkle_tree_number})
  if(curMerkleTree != null) {
    return curMerkleTree
  }
  else {
    throw Error("Get Merkle Tree Info: Fail!")
    return {}
  }
}

export { getMerkleTreeInfo }
