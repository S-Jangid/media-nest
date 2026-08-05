import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler( async (req, res) => {


    const {username, email, fullName, password} = req.body;

    if(
        [username, email, fullName, password].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All the fields are required" );
    }

    const userExisting = await User.findOne( {

        $or : [{username}, {email}]
    }
    )

    if(userExisting){
        throw new ApiError(409, "User is already registered");
    }

    const avatarTempPath = req.files?.avatar[0]?.path;

    let coverImageTempPath = "";

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageTempPath = req.files.coverImage[0].path;
    }

    if( ! avatarTempPath ){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadFileToCloudinary(avatarTempPath);
    const coverImage = await uploadFileToCloudinary(coverImageTempPath);
    console.log(avatar);

    if( ! avatar){
        throw new ApiError(400, "Avatar uploading to cloudinary failed ");
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url,
        email : email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if( !userCreated ){
        throw new ApiError(500, "Something went wrong while creating user");
    }

    // res.status(200).json({
    //     message: "User registered"
    // });

    res.status(201).json(
        new ApiResponse(200, "User registered successfully", userCreated)
    )
});


export {registerUser};