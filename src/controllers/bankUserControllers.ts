import BankUser, { IBankUser } from "../models/BankUsersSchema";
import { Request } from "express";
import * as dotenv from "dotenv";


dotenv.config();


async function register (req: Request) {
  let data: any = req.body
  let username: any = data.username
  let password: any = data.password
  let name: string = data.name
  let age: number = data.age
  let address: string = data.address
  let timestamp: string = data.timestamp
  let public_key: string = data.public_key

  let bankUserCheck: IBankUser | null = await BankUser.findOne({public_key: public_key})

  if (bankUserCheck == null) {
    try{
      let newBankUser = new BankUser({
        username: username,
        password: password,
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

async function checkLogin (req: Request){
  let data = req.body
  let username = data.username
  let password = data.password

  let bankUserCheck: IBankUser | null = await BankUser.findOne({username: username})
  if (bankUserCheck == null) {
    throw Error("Bank User doesn't existed!")
  } else {
    return password == bankUserCheck.password
  }
}

export { register, checkLogin }