import BankUser, { IBankUser } from "../models/BankUsersSchema";
import { Request } from "express";
import * as dotenv from "dotenv";
const { groth16 } = require("snarkjs");
const v_key = require("./verification_key.json")


dotenv.config();


async function register (req: Request) {
  let data: any = req.body
  let username: any = data.username
  let password: any = data.password
  let account_number: string = data.name

  let bankUserCheck: IBankUser | null = await BankUser.findOne({account_number: account_number})

  if (bankUserCheck == null) {
    try{
      let newBankUser = new BankUser({
        username: username,
        password: password,
        account_number: account_number,
        proof: {}
      })

      await newBankUser.save();

      return await BankUser.findOne({account_number: account_number})
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

async function verifyProof (req: Request) {
  let data = req.body
  let proof = data.proof
  let publicSignals = data.publicSignals

  const res = await groth16.verify(v_key, publicSignals, proof);
  return res
}

export { register, checkLogin, verifyProof }