import { Schema, model, Document } from "mongoose";

export interface IBankUser extends Document {
  username: string;
  password: string;
  account_number: string;
  proof: string;
}

const BankUserSchema: Schema = new Schema({
  username: {type: String, require: true},
  password: {type: String, require: true},
  account_number:  {type: String, require: true},
  proof: {type: String, require: true}
}, {collection: 'bankusers', versionKey: false})

export default model<IBankUser>("BankUser", BankUserSchema)