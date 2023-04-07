import { Schema, model, Document } from "mongoose";

export interface IUserCached extends Document {
  _id: number;
  auth_hash: string[];
  credit_score: number;
  timestamp: number;
  hash: string[];
  public_key: string[];
}

const UserCachedSchema: Schema = new Schema({
  _id: {type: Number, require:true},
  auth_hash: {type: Array, require: true},
  credit_score: {type: Number, require:true},
  timestamp: {type: Number, require:true},
  hash: {type: Array, require: true},
  public_key: {type: Array, require: true},
}, {collection: 'usercached'})

export default model<IUserCached>("UserCached", UserCachedSchema)