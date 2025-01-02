import { Router } from "express";
import { registerUser ,
    loginUser,
    logoutUser,
    refreshAccessToken,
    ChangeCurrentPassword,
    GetCurrentUser,
    UpdateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
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
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").post(verifyJWT, ChangeCurrentPassword)
userRouter.route("/current-user").get(verifyJWT, GetCurrentUser)
userRouter.route("/update-account").patch(verifyJWT, UpdateAccountDetails)
userRouter.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
userRouter.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
userRouter.route("/c/:username").get(verifyJWT,getUserChannelProfile)
userRouter.route("/watch-history").get(verifyJWT,getWatchHistory)

export {userRouter}