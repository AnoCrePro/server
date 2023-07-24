import { Schema, model, Document } from "mongoose";

export interface ICryptoScanUser extends Document {
  balance: string;
  timestamp: string;
  public_key: string;
}

const CryptoScanUserSchema: Schema = new Schema({
  balance: {type: String, require:true},
  timestamp: {type: String, require:true},
  public_key: {type: String, require: true},
}, {collection: 'cryptoscanusers', versionKey: false})

export default model<ICryptoScanUser>("CryptoScanUser", CryptoScanUserSchema)