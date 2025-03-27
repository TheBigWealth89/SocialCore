import { Router } from "express";
const commentRouter = Router();

// ******* postt a new comment **********
commentRouter.post("/:postId");

// **** Get al comments for post *****
commentRouter.get("/:postId");

// ****** update a comment *****
commentRouter.put("/:commentId");

// ****** delete a comment  *****
commentRouter.delete("/:commentId");

//**** like/unlike post *****/
commentRouter.post("/:commentId/like");

export default commentRouter;
