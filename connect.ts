import mongoose from "mongoose";

function connectMongoDB() {
  var mongoDB: string = process.env.mongoDB || ''
  mongoose.connect(mongoDB, {dbName: "DANC"})

  const database = mongoose.connection;
  database.on("error", (error) => {
    console.log(error)
  })

  database.once("connected", () => {
    console.log("Database Connected")
  })
}

export {connectMongoDB}