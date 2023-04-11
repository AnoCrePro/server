import BankUser, { IBankUser } from "../models/BankUsersSchema";
import { Request } from "express";
import * as dotenv from "dotenv";


dotenv.config();


async function register (req: Request) {
  var data: any = req.body
  var name: string = data.name
  var age: number = data.age
  var address: string = data.address
  var timestamp: string = data.timestamp
  var public_key: string = data.public_key

  var bankUserCheck: IBankUser | null = await BankUser.findOne({public_key: public_key})

  if (bankUserCheck == null) {
    try{
      var newBankUser = new BankUser({
        name: name,
        age: age,
        address: address,
        public_key: public_key,
        timestamp: timestamp,
        proof: {}
      })

      await newBankUser.save();

      return await BankUser.findOne({public_key: public_key})
    } 
    catch(err) {
      console.log("Bank: Register Fail!", err)
    }
  }  
  else {
    throw Error("Bank User existed!")
  }
}

export { register }