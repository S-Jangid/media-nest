import { Router } from "express";
import { changePassword, loginUser, logoutUser, regenerateAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1

        }
    ]),    
    registerUser
);

router.route("/login").post(
    loginUser
);  

// Secure route

router.route("/logout").post(
    authJWT,
    logoutUser
);  

router.route("/access-token").post(
    regenerateAccessToken
);  

router.route("/change-password").post(
    authJWT,
    changePassword
);  

export default router; 