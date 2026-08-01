import mongoose, { connect } from "mongoose"
import { DB_NAME } from "../constants.js"



export const connectDB = async () => {
    try {

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Database connected, MongoDB host: ${
            connectionInstance.connection.host
        }`)

    } catch (error) {
        console.log('Error connecting database', error)
        process.exit(1)
    }
}

export default connectDB;