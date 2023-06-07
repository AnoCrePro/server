import { Schema, model, Document } from "mongoose";

export interface IThirdPartyAPIKey extends Document {
  _id: string;
  key_id : string;
  key: string;
  userId: string;
  scope: string;
  status: string;
  condition: number;
  operator: number;
  keyName: string;
  createDate: string
}

const ThirdPartyAPIKeySchema: Schema = new Schema({
  _id: {type: String, require: true},
  userName: {type: String, require: true},
  id: {type: Number, require:true},
  bankId: {type: String, require:true},
  password: {type: String, require: true},
}, {collection: 'centic-services-api-keys', versionKey: false})

export default model<IThirdPartyAPIKey>("ThirdPartyAPIKey", ThirdPartyAPIKeySchema)