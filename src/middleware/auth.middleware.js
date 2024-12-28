import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const verifyJWT = asyncHandler(async (req,res,next) => {

    try {
        console.log(req.cookies)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        console.log(token)
    
        if(!token){
            res.status(400).json({
                message : "Unauthorised Request"
            })
        }

        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log(decodedtoken);
        
        const user = await User.findById(decodedtoken?._id).select("-password -refreshToken")
    
        if (!user) {
            res.status(400).json({
                message : "User not Found"
            })
        }
    
        req.user = user
        next()
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return res.status(401).json({
            message: error.message || "Invalid AccessToken",
        });
    }
})

export {verifyJWT}