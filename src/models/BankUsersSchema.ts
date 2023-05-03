import { Schema, model, Document } from "mongoose";

export interface IBankUser extends Document {
  username: string;
  password: string;
  name: string;
  age: number;
  address: string;
  public_key: string;
  timestamp: string;
  proof: object;
}

const BankUserSchema: Schema = new Schema({
  username: {type: String, require: true},
  password: {type: String, require: true},
  name: {type: String, require: true},
  age: {type: Number, require: true},
  address: {type: String, require: true},
  public_key: {type: String, require: true},
  timestamp: {type: String, require: true},
  proof: {type: Object, require: true},
}, {collection: 'bankusers', versionKey: false})

export default model<IBankUser>("BankUser", BankUserSchema)