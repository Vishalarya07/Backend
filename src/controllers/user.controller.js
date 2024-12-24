import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
        res.status(400).json({
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

    const accesstoken = await user.generateAccessToken(user._id)
    const refreshtoken = await user.generateRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    const options = {
        httpOnly: true,
        secure: true
    };
    
    return res.status(201)
    .cookie("accesstoken", accesstoken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json({
        user: loggedInUser, accesstoken, refreshtoken,
    
        message : "User Registered successfully"
    })
    
})

export {registerUser,
    loginUser
}