import { Schema, model, Document } from "mongoose";

export interface IUserLeaf extends Document {
  _id: number;
  auth_hash: string[];
  credit_score: number;
  timestamp: number;
  hash: string[];
  public_key: string[];
  parent: number;
  type: number
}

const UserLeafSchema: Schema = new Schema({
  _id: {type: Number, require:true},
  auth_hash: {type: Array, require: true},
  credit_score: {type: Number, require:true},
  timestamp: {type: Number, require:true},
  hash: {type: Array, require: true},
  public_key: {type: Array, require: true},
  parent: {type: Number, require:true},
  type: {type: Number, require:true},
}, {collection: 'merkletree'})

export default model<IUserLeaf>("UserLeaf", UserLeafSchema)