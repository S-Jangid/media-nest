import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler( async (req, res) => {


    const {username, email, fullname, password} = req.body;

    if(
        [username, email, fullname, password].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All the fields are required" );
    }

    const userExisting = User.findOne( 
        $or = [{username}, {email}]
    )

    if(userExisting){
        throw new ApiError(409, "User is already registered");
    }

    const avatarTempPath = req.files?.avatar[0]?.path;
    const coverImageTempPath = req.files?.coverImage[0]?.path;

    if( ! avatarTempPath ){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadFileToCloudinary(avatarTempPath);
    const coverImage = await uploadFileToCloudinary(coverImageTempPath);

    if( ! avatar){
        throw new ApiError(400, "Avatar uploading to cloudinary failed ");
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url,
        email : email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password
    })

    const userCreated = User.findById(user._id).select(
        "-password -refreshToken"
    );

    if( !userCreated ){
        throw new ApiError(500, "Something went wrong while creating user");
    }

    // res.status(200).json({
    //     message: "User registered"
    // });

    res.status(201).json(
        ApiResponse(200, "User registered successfully", userCreated)
    )
});


export {registerUser};