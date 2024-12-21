import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log(`MongoDB is Connected host:${connectionInstance.connection.host}` );
        // console.log(connectionInstance);
    } catch (error) {
        console.log("DataBase is not connected", error);
        throw error;
    }
}

export default connectDB;