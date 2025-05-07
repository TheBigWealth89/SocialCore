import { Router } from "express";
import { authorization } from "../middleware/authMiddleware";
import FollowController from "../controller/followController";
const followRouter = Router();
followRouter.use(authorization);

// *** follow  user *****
followRouter.post("/:targetUserId", FollowController.follow);

//Get a user's  followers
followRouter.get("/followers/:userId", FollowController.getFollowers);

//Get who user is following
followRouter.get("/following/:userId", FollowController.getFollowings);

//STATUS **** check if current user follow another user  *******
followRouter.get("/status/:targetUserId", FollowController.getFollowStatus);

// *** unfollow  user *****
followRouter.delete("/:targetUserId", FollowController.unfollow);

export default followRouter;
