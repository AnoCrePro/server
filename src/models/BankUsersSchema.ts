import { Schema, model, Document } from "mongoose";

export interface IBankUser extends Document {
  name: string;
  credit_score: number;
  timestamp: string;
  public_key: string;
}

const BankUserSchema: Schema = new Schema({
  name: {type: String, require: true},
  credit_score: {type: Number, require:true},
  timestamp: {type: String, require:true},
  public_key: {type: String, require: true},
}, {collection: 'bankusers', versionKey: false})

export default model<IBankUser>("BankUser", BankUserSchema)