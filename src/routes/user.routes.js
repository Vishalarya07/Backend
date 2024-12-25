import { Router } from "express";
import { registerUser ,
    loginUser,
    logoutUser,
    refreshAccessToken
} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const userRouter= Router()

userRouter.route("/register").post(upload.fields(
   [
    {
        name : "avatar",
        maxUpload : 1
    },
    {
        name : "coverImage",
        maxUpload : 1
    }
   ] 
),registerUser)

userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/refreshtoken").post(refreshAccessToken)

export {userRouter}