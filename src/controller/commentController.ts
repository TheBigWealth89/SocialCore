import { NextFunction, Request, Response } from "express";
import post from "../models/Post";
import Comment from "../models/Comment";
class commentController {
  /**
   * @desc    Create a new comment
   * @route   POST /api/comments/postId
   * @access  Private
   */
  async createComment(req: Request, res: Response): Promise<any> {
    const { text } = req.body;
    const postId = req.params.postId?.trim().toString(); 
    const userId = req.user?.userId; // From auth middleware

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment field is required" });
    }

    // Check if postID exists
    if (!postId) {
      return res.status(400).json({ error: "Post id is required" });
    }

    try {
      // Verify the post exists
      const postExists = await post.exists({ _id: postId });

      if (!postExists) {
        return res.status(400).json({
          error: "Post not found",
        });
      }

      const comment = await Comment.create({
        text,
        userId,
        postId,
      });

      // Update the post's comments count
      await post.findByIdAndUpdate(
        postId,
        { $inc: { commentCount: 1 } },
        { upsert: true } // Ensure the field is created if it doesn't exist
      );

      res
        .status(200)
        .json({ Message: "Comment created successfully", Data: comment });
    } catch (error) {
      console.error("Error creating comment:", error); // Debugging log
      res.status(500).json({ error: "Failed to create a comment" });
    }
  }

  /**
   * @desc    Get all comments for a post
   * @route   GET /api/comments/posts/:postId
   * @access  Public
   */
  async getCommentByPost(req: Request, res: Response) {
    try {
      const comments = await Comment.find({
        postId: req.params.postId,
        status: "active",
      })
        .populate("userId", "username email")
        .sort({ createAt: -1 });
      console.log("Raw comments:", comments);
      res
        .status(200)
        .json({ message: "Successfully retrieved  comments", Data: comments });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  }

  /**
   * @desc    Get a single comment
   * @route   GET /api/comment/:id
   * @access  Public
   */
  async getCommentById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const commentId = req.params.id;

      if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required" });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      return res
        .status(200)
        .json({ Message: "Comment successfully retrieved", Data: comment });
    } catch (error) {
      console.error("Error retrieving comment by ID:", error);
      return res.status(404).json({ error: "Failed to get comment" });
    }
  }

  /**
   * @desc    Update a comment
   * @route   PUT /api/comments/:id
   * @access  Private (Comment owner only)
   */
  async updateComment(req: Request, res: Response): Promise<any> {
    const { text } = req.body;
    const userId = req.user?.userId;
    const id = req.params.commentId;

    if (!id) {
      return res.status(400).json({ error: "Comment ID is required" });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    try {
      const comment = await Comment.findOneAndUpdate(
        { _id: id, userId: userId, status: "active" },
        { text, updatedAt: new Date() },
        { new: true } // Return the updated comment
      );

      if (!comment) {
        return res
          .status(404)
          .json({ error: "Comment could not be found or not authorized" });
      }

      return res
        .status(200)
        .json({ Message: "Comment successfully updated", Data: comment });
    } catch (error) {
      console.error("Error updating comment:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to update comment" });
      }
    }
  }

  /**
   * @desc    Like a comment
   * @route   POST /api/comments/:commentId/like
   * @access  Private
   */
  async likeComment(req: Request, res: Response): Promise<any> {
    const id = req.params.commentId;
    const userId = req.user?.userId; // Assuming user ID is available from auth middleware

    try {
      const comment = await Comment.findById(id);

      if (!comment) {
        return res.status(400).json({ error: "Comment not found" });
      }

      // Check if the user has already liked the comment
      const alreadyLiked = comment.likes.some(
        (likedId) => likedId.toString() === userId.toString()
      );
      if (!alreadyLiked) {
        return res
          .status(400)
          .json({ error: "You have already liked this comment" });
      }

      // Add the user's ID to the likes array
      comment.likes.push(userId);
      await comment.save();

      return res
        .status(200)
        .json({ message: "Successfully liked comment", Data: comment });
    } catch (error) {
      return res.status(500).json({ error: "Failed to like comment" });
    }
  }

  /**
   * @desc    Unlike a comment
   * @route   POST /api/comments/:commentId/unlike
   * @access  Private
   */
  async unlikeComment(req: Request, res: Response): Promise<any> {
    const id = req.params.commentId;
    const userId = req.user?.userId;
    try {
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(400).json({ error: "Cannot find comment" });
      }
      const hasLiked = comment.likes.some(
        (likedId) => likedId.toString() === userId.toString()
      );

      if (!hasLiked) {
        return res.status(400).json({ error: "Comment has no likes yet" });
      }

      comment.likes.filter((likeId) => likeId.toString() !== userId.toString());

      await comment.save();
      return res.status(200).json({ message: "Successfully unliked comment " });
    } catch (error) {
      return res.status(500).json({ error: "Failed to unlike comment" });
    }
  }

  /**
   * @desc    Delete a comment (soft delete)
   * @route   DELETE /api/comments/:id
   * @access  Private (Comment owner or admin)
   */
  async deleteComment(req: Request, res: Response): Promise<any> {
    const userId = req.user?.userId;
    const id = req.params.commentId;

    try {
      const comment = await Comment.findByIdAndUpdate(
        { _id: id, userId: userId, status: "active" }, // Only delete active comment
        { status: "deleted", deleteAt: new Date() },
        { new: true } // Return the updated comment
      );

      if (!comment || comment.userId.toString() !== userId) {
        return res
          .status(400)
          .json({ error: "Comment not found or not authorized" });
      }

      //Decrement comment counts
      await post.findByIdAndUpdate(comment.postId, {
        $inc: { commentCount: -1 },
      });

      return res
        .status(200)
        .json({ message: "Successfully deleted comment", data: comment });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete comment" });
    }
  }
}

export default new commentController();
