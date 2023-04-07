import { Schema, model, Document } from "mongoose";

export interface IBankUser extends Document {
  name: string;
  age: number;
  address: string;
  public_key: string;
  proof: object;
}

const BankUserSchema: Schema = new Schema({
  name: {type: String, require: true},
  age: {type: Number, require: true},
  address: {type: String, require: true},
  public_key: {type: String, require: true},
  proof: {type: Object, require: true},
}, {collection: 'bankusers', versionKey: false})

export default model<IBankUser>("BankUser", BankUserSchema)