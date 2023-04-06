import mongoose from "mongoose";

function connectMongoDB() {
  var mongoDB: string = process.env.mongoDB || ''
  mongoose.connect(mongoDB, {dbName: "DefiHubDB"})

  const database = mongoose.connection;
  database.on("error", (error) => {
    console.log(error)
  })

  database.once("connected", () => {
    console.log("Database Connected")
    database.db.listCollections().toArray()
    .then((collections) => {
      console.log('Collections:', collections);
    })
    .catch((err) => {
      console.error('Error:', err);})
    })
}

export {connectMongoDB}