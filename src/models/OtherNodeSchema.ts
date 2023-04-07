import { Schema, model, Document } from "mongoose";

export interface IOtherNode extends Document {
  _id: string;
  hash: string;
  parent: string;
  level: number
}

const OtherNodeSchema: Schema = new Schema({
  _id: {type: String, require: true},
  hash: {type: String, require: true},
  parent: {type: String, require:true},
  level: {type: Number, require:true},
}, {collection: 'merkletree', versionKey: false})

export default model<IOtherNode>("OtherNode", OtherNodeSchema)