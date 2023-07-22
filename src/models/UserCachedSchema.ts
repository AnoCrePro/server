import { Schema, model, Document } from "mongoose";

export interface IUserCached extends Document {
  _id: number;
  auth_hash: string;
  balance: string;
  timestamp: string;
  hash: string;
  public_key: string;
  bank_id: string;
}

const UserCachedSchema: Schema = new Schema({
  _id: {type: Number, require:true},
  auth_hash: {type: String, require: true},
  balance: {type: String, require:true},
  timestamp: {type: String, require:true},
  hash: {type: String, require: true},
  public_key: {type: String, require: true},
  bank_id: {type: String, require: true},
}, {collection: 'usercached', versionKey: false})

export default model<IUserCached>("UserCached", UserCachedSchema)