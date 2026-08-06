import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';


const authJWT = asyncHandler( async(req, _) => {

    const accessToken = req?.cookies("requestToken") || req?.header("Authorization").replace('Bearer: ', "");

    if(!accessToken){
        ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    
    const user = await User.findById(decodedToken._id);
    
    if(!user){
        ApiError(401, "Invalid access request");
    }

    req.user = user;
})

export {authJWT};