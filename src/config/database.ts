import { error } from "console";
import mongoose from "mongoose";
require("dotenv").config();

const connectDb = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("Mongo config didnt found .env file");
    }
    await mongoose.connect(mongoURI);
    console.log("MongoDb connected successfully.");
  } catch (error) {
    console.error("MongoDb connection error ");
    process.exit(1);
  }
};

export default connectDb;
