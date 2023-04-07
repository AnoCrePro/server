import { Schema, model, Document } from "mongoose";

export interface IUserLeaf extends Document {
  _id: number;
  auth_hash: string;
  credit_score: number;
  timestamp: string;
  hash: string;
  public_key: string;
  parent: string;
  level: number
}

const UserLeafSchema: Schema = new Schema({
  _id: {type: Number, require:true},
  auth_hash: {type: String, require: true},
  credit_score: {type: Number, require:true},
  timestamp: {type: String, require:true},
  hash: {type: String, require: true},
  public_key: {type: String, require: true},
  parent: {type: String, require:true},
  level: {type: Number, require:true},
}, {collection: 'merkletree', versionKey: false})

export default model<IUserLeaf>("UserLeaf", UserLeafSchema)