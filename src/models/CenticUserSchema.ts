import { Schema, model, Document } from "mongoose";

export interface ICenticUser extends Document {
  credit_score: number;
  timestamp: string;
  public_key: string;
}

const CenticUserSchema: Schema = new Schema({
  credit_score: {type: Number, require:true},
  timestamp: {type: String, require:true},
  public_key: {type: String, require: true},
}, {collection: 'centicusers', versionKey: false})

export default model<ICenticUser>("CenticUser", CenticUserSchema)