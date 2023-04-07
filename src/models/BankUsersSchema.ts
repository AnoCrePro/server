import { Schema, model, Document } from "mongoose";

export interface IBankUser extends Document {
  _id: number;
  name: string;
  credit_score: number;
  timestamp: number;
  public_key: string[];
}

const BankUserSchema: Schema = new Schema({
  _id: {type: Number, require:true},
  name: {type: String, require: true},
  credit_score: {type: Number, require:true},
  timestamp: {type: Number, require:true},
  public_key: {type: Array, require: true},
}, {collection: 'bankusers'})

export default model<IBankUser>("BankUser", BankUserSchema)