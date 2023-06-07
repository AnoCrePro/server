import { Schema, model, Document } from "mongoose";

export interface IThirdPartyUsers extends Document {
  _id: string;
  userName: string;
  id: string;
  bankId: string;
  password: string;
}

const ThirdPartyUsersSchema: Schema = new Schema({
  _id: {type: String, require: true},
  userName: {type: String, require: true},
  id: {type: Number, require:true},
  bankId: {type: String, require:true},
  password: {type: String, require: true},
}, {collection: 'centic-services-user', versionKey: false})

export default model<IThirdPartyUsers>("ThirdPartyUsers", ThirdPartyUsersSchema)