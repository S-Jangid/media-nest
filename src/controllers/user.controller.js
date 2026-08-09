import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave : false});

        return {accessToken, refreshToken};
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens");
    }
}


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

const loginUser = asyncHandler( async(req, res) => {
    // console.log("body", req.body);
    const {username, email, password} = req.body;
    // const {username, email, fullName, password} = req.body;

    if( !username && !email){
        throw new ApiError(400, "username or password is required");
    }

    const user = await User.findOne({
        $or : [ {username}, {email}]
    });

    if(!user){
        throw new ApiError(400, "user does not exist");
    }

    const validPassword = await user.isCorrectPassword(password);

    if(! validPassword){
        throw new ApiError(400, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken ");

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)
    .json(
        new ApiResponse(200, "User logged in successfully",{
                user : loggedInUser, accessToken, refreshToken
            }
        )
    )

    // ApiResponse(200, "")

})

const logoutUser = asyncHandler(async (req, res) => {

    console.log(req.user);
    
    await User.findByIdAndUpdate(req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie( "accessToken", options)
    .clearCookie( "refreshToken", options)
    .json( 
        new ApiResponse(200, {}, "User logged out ")
    )
});

const regenerateAccessToken = asyncHandler(async(req,res) => {
    const reqRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if(!reqRefreshToken){
        throw new ApiError(401, "Unauthorized request");
    }

    const decodedRefreshToken = jwt.verify(reqRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    if(! decodedRefreshToken){
        throw new ApiError(401, "Invalid Refresh Token");
    }
    
    const user = await User.findById(decodedRefreshToken?._id);
    
    if(!user){
        throw new ApiError(401, "Invalid Refresh Token");
    }

    if (reqRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
        
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const option = {
        httpOnly: true,
        secure: true
    };

    res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(200, "Access token regenarated successfully", {accessToken, refreshToken})
    )
})

const changePassword = asyncHandler(async(req, res) => {

    const { currentPassword, newPassword } = req.body;

    if(!currentPassword || !newPassword ){
        throw new ApiError(400, "Password fields are required");    
    }
    
    
    // As we will apply the middleware to get the user id from the access token as user will be already logged in to update his details
    const user = await User.findById(req.user._id);

    const isCorrectPassword = user.isCorrectPassword(currentPassword);

    if( ! isCorrectPassword){
        throw new ApiError(400, "Incorrect password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Password changed successfully",
            {}
        )
    )


})

const getCurrentUser = asyncHandler(async(req, res) => {

    const user = req.user;

    res
    .status(200)
    .json(
        200,
        "Fetched current user details successfully",
        user
    )
}) 

const updateAccountDetails = asyncHandler(async(req, res) => {

    const { fullName, email } = req.body;

    if(! (fullName && email) ){
        throw new ApiError(400, "FullName and Email are required");
    }

    // As we will apply the middleware to get the user id from the access token as user will be already logged in to update his details
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");    

    res.status(200)
    .json(

        new ApiResponse(
            200,
            "Account details updated successfully",
            user
        )
    );

})

const updateUserAvatar = asyncHandler( async(req,res) => {

    // We will have the multer as the middleware to get the files.
    const localAvatarFile = req.file?.path;

    if( ! localAvatarFile){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadFileToCloudinary(localAvatarFile);

    
    if( ! avatar.url){
        throw new ApiError(500, "Something went wrong while uploading the avatar to cloudinary");
    }

    // As we will apply the middleware to get the user id from the access token as user will be already logged in to update his details
    const user = await User.findByIdAndUpdate(
        user?._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Avatar updated successfully",
            user
        )
    );


})

const updateUserCoverImage = asyncHandler( async(req,res) => {

    // We will have the multer as the middleware to get the files.
    const localCoverImagePath = req.file?.path;

    if( ! localCoverImagePath){
        throw new ApiError(400, "Cover image file is required");
    }

    const coverImage = uploadFileToCloudinary(localCoverImagePath);

    if( ! coverImage.url){
        throw new ApiError(500, "Something went wrong while uploading the cover image to cloudinary");
    }

    // As we will apply the middleware to get the user id from the access token as user will be already logged in to update his details
    const user = await User.findByIdAndUpdate(
        user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Cover image updated successfully",
            user
        )
    );


})


export {registerUser, loginUser, logoutUser, regenerateAccessToken, changePassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage};