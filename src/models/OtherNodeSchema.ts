import { Schema, model, Document } from "mongoose";

export interface IOtherNode extends Document {
  _id: number;
  hash: string[];
  parent: number;
  type: number
}

const OtherNodeSchema: Schema = new Schema({
  _id: {type: Number, require:true},
  hash: {type: Array, require: true},
  parent: {type: Number, require:true},
  type: {type: Number, require:true},
}, {collection: 'merkletree'})

export default model<IOtherNode>("OtherNode", OtherNodeSchema)