import { Router } from "express";
import { registerUser ,
    loginUser
} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"

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

export {userRouter}