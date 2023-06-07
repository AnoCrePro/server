const { MongoClient } = require("mongodb");
const mongooes = require("mongoose");

const connectString = "mongodb+srv://centic:centic%40123@cluster0.kwlxc.mongodb.net/admin?authSource=admin&replicaSet=atlas-aug2p6-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true";
const client = new MongoClient(connectString);

export async function getDBConnection () {
  await client.connect();
  const db = client.db("centic");
  return db;
};