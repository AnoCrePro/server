import { Schema, model, Document } from "mongoose";

export interface IMerkleTree extends Document {
  _id: number;
  root: string;
  level: number;
  number_of_leaf: number;
  timestamp: string;
}

const MerkleTreeSchema: Schema = new Schema({
  _id: {type: Number, require:true},
  root: {type: String, require: true},
  level: {type: Number, require:true},
  number_of_leaf: {type: Number, require:true},
  timestamp: {type: String, require: true},
}, {collection: 'merkletreeinfo', versionKey: false})

export default model<IMerkleTree>("MerkleTree", MerkleTreeSchema)