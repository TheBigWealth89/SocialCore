import { Router } from "express";
import commentController from "../controller/commentController";
import { authMiddleware } from "../middleware/validateRegisterInput";
const commentRouter = Router();
commentRouter.use(authMiddleware);
// ******* post a new comment **********
commentRouter.post("/:postId", commentController.createComment);

// **** Get al comments for post *****
commentRouter.get("/posts/:postId", commentController.getCommentByPost);

// ****** Get comment by id*****
commentRouter.get("/:id", commentController.getCommentById);

// ****** update a comment *****
commentRouter.put("/:commentId", commentController.updateComment);
  
// ****** delete a comment  *****
commentRouter.delete("/:commentId", commentController.deleteComment);

//**** like post *****/
commentRouter.post("/:commentId/like", commentController.likeComment);
//**** Unlike post *****/
commentRouter.post("/:commentId/unlike", commentController.unlikeComment);

export default commentRouter;
