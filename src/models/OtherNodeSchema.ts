import { Schema, model, Document } from "mongoose";

export interface IOtherNode extends Document {
  hash: string;
  parent: number;
  type: number
}

const OtherNodeSchema: Schema = new Schema({
  hash: {type: String, require: true},
  parent: {type: Number, require:true},
  type: {type: Number, require:true},
}, {collection: 'merkletree', versionKey: false})

export default model<IOtherNode>("OtherNode", OtherNodeSchema)