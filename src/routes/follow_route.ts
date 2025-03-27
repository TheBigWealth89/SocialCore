import { Router } from "express";
const followRouter = Router();

//Get a user's a followers
followRouter.get("/followers/:userId");

//Get who user is following
followRouter.get("followings/:userId");

//STATUS **** check if current user follow another user  *******
followRouter.get("/status/:targetUserId");

// *** follow  user *****
followRouter.post("/targetUserId");

// *** unfollow  user *****
followRouter.delete("/targetUserId");

export default followRouter;
