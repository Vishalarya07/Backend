import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessandRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // console.log(refreshToken);
        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        console.log(error);
    }
}

const registerUser = asyncHandler( async (req, res) => {
    //Take Data from frontend
    //Validate the data
    //check the user is already registered
    //files are uploaded and avatar file is must
    //upload it to cloudinary
    //check user object - create entry in database
    //remove the password and refresh token from the response
    //check the user creation
    //return response
    
    const {fullName, username, email, password} = req.body

    if ([fullName, username, email, password].some((field)=>{
        return field?.trim() === ""
    })) {
        return res.status(400).json({
            message : "Provide username and password"
        })
    }    
    
    const existingUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existingUser){
        res.status(400).json({
            message : "User with this username or email already exists"
        })
    }

    const localStoragePathAvatar = req.files?.avatar[0]?.path
    const localStoragePathCoverImage = req.files?.coverImage[0]?.path

    if(!localStoragePathAvatar){
        res.status(400).json({
            message: "Avatar is Required"
        })
    }

    const uploadAvatar = await uploadonCloudinary(localStoragePathAvatar)
    const uploadCoverImage = await uploadonCloudinary(localStoragePathCoverImage)

    if(!uploadAvatar){
        res.status(400).json({
            message: "Avatar is Required"
        })
    }

    const user = await User.create({
        username : username,
        email,
        fullName,
        avatar: uploadAvatar.url,
        coverImage: uploadCoverImage?.url || "",
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        res.status(500).json({
            message : "Something went wrong while registering user"
        })
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    
    const {username, email, password} = req.body
    
    if(!username && !email){
        res.status(400).json({
            message : "Provide the Email and password"
        })
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })
    
    if(!user){
        res.status(400).json({
            message : "User is not registered"
        })
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        res.status(400).json({
            message : "Invalid User Credential"
        })
    }

    const accessToken = await user.generateAccessToken(user._id)
    const refreshToken = await user.generateRefreshToken(user._id)

    const loggedInUser = await User.findByIdAndUpdate(user._id, {
        $set : {
            refreshToken : refreshToken
        }
    }).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    };
    
    return res.status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
        user: loggedInUser, accessToken, refreshToken,
    
        message : "User Registered successfully"
    })
    
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset : {
            refreshToken : 1
        }
    },{
        new : true
    })

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
        message : "User LoggedOut Successfully"
    })
})

const refreshAccessToken = asyncHandler(async(req, res) => {

    try {
    // console.log(req.cookies);
    
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        // console.log(incomingRefreshToken);
        if(!incomingRefreshToken){
            res.status(401).json({
                message : "Unauthorized request"
            })
        }
    
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decoded._id)
    
        if(!user){
            res.status(401).json({
                message : "Invalid Refreshtoken"
            })
        }
        // console.log(user.refreshToken);
        
        if(incomingRefreshToken != user?.refreshToken){
            res.status(401).json({
                message : "Refresh token is expired or used"
            })
        }
    
        const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)
        // console.log(refreshToken);
        
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            user : {accessToken, refreshToken}, 
            message : "AccessToken Refreshed"
        })
    } catch (error) {
        console.log("refreshaccesstoken error : ", error)
    }

})

const ChangeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldpassword, newpassword} = req.body

    const user = await User.findById(req.user?._id)
    const ispassword = await user.isPasswordCorrect(oldpassword)

    if(!ispassword){
        res.status(401).json({
            message : "Incorrect password"
        })
    }

    await user.save({validateBeforeSave : false})

    return res.status(201).json({
        message : "Password Changed Successfully"
    })
})

const GetCurrentUser = asyncHandler(async (req,res) => {
    return res.status(201)
    .json({
        user : req.user,
        message : "User Fetched Successfully"
    })
})

const UpdateAccountDetails = asyncHandler(async(req,res) => {

    const {fullName, email} = req.body

    if(!fullName || !email){
        return res.status(400).json({
            message : "Provide Name and Email"
        })
    }

    const user = await User.findById(req.user?._id).select("-password")

    if(!user){
        return res.status(401).json({
            message : "Provide Correct Email"
        })
    }

    user.fullName=fullName
    user.email = email

    return res.status(201)
    .json({
        user : user,
        message : "User Details updated Successfully"
    })

})

const updateUserAvatar = asyncHandler(async(req,res)=>{

    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    if(!user){
        return res.status(401).json({
            message : "Unauthorized User"
        })
    }

    const localStoragePathAvatar = req.file?.path

    if(!localStoragePathAvatar){
        return res.status(401).json({
            message : "Avatar not Uploaded"
        })
    }

    const uploadAvatar = await uploadonCloudinary(localStoragePathAvatar)

    if(!uploadAvatar.url){
        return res.status(401).json({
            message : "Avatar not uplaoding to cloudinary"
        })
    }

    user.avatar = uploadAvatar.url
    await user.save({validateBeforeSave:false})

    return res.status(201).json({
        user,
        message : "Avatar Changed Successfully"
    })
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{

    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    if(!user){
        return res.status(401).json({
            message : "Unauthorized User"
        })
    }

    const localStoragePathCoverImage = req.file?.path

    if(!localStoragePathCoverImage){
        return res.status(401).json({
            message : "CoverImage not Uploaded"
        })
    }

    const uploadCoverImage = await uploadonCloudinary(localStoragePathCoverImage)

    if(!uploadCoverImage.url){
        return res.status(401).json({
            message : "CoverImage not uplaoding to cloudinary"
        })
    }

    user.coverImage = uploadCoverImage.url
    await user.save({validateBeforeSave:false})

    return res.status(201).json({
        user,
        message : "CoverImage Changed Successfully"
    })
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    ChangeCurrentPassword,
    GetCurrentUser,
    UpdateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}