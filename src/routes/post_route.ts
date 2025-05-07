import { Router } from "express";
import postController from "../controller/postController";
import { authorization } from "../middleware/authMiddleware";
const postRouter = Router();

//**** create a new post *****/
postRouter.use(authorization);
postRouter.post("/", postController.createPost);

//****Get all posts *****/
postRouter.get("/", postController.getAllPosts);

//**** Get a specific post  *****
postRouter.get("/:id", postController.getPostById);

//**** Update by id *****/
postRouter.put("/:id", postController.updatePost);

//**** Delete post by id *****/
postRouter.delete("/:id", postController.deletePost);

//****Like Posts  *****/
postRouter.post("/:id/like", postController.likePost);
//**** Unlike posts *****/
postRouter.post("/:id/unlike", postController.unlikePost);

export default postRouter;
