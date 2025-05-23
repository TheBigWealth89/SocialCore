import { NextFunction, Request, Response } from "express";
import Post from "../models/Post";
import { PostCreatePayload, contentBlock } from "../types/post.types";

class postController {
  /**
   * @desc    Create a new post
   * @route   POST /api/posts
   * @access  Private
   */

  async createPost(
    req: Request<{}, {}, PostCreatePayload>,
    res: Response
  ): Promise<any> {
    //Get data from request
    const { title, content, tags } = req.body;
    const userId = req.user?.userId;

    try {
      if (!userId) {
        return res
          .status(401)
          .json({ error: "You must logged in to create a post" });
      }
      if (!title || title.trim() === "") {
        return res.status(400).json({
          error: "Post title is required",
        });
      }
      if (!content || content.length === 0) {
        return res.status(400).json({ error: "Post content cannot be empty" });
      }
      //validate each content block
      for (const block of content) {
        if (!["text", "image", "video"].includes(block.type)) {
          return res
            .status(400)
            .json({ error: `Invalid content type: ${block.type}` });
        }

        if (!block.content || block.content.trim() === "") {
          return res.status(400).json({ error: "Content cannot be empty" });
        }
      }

      // 4. Create the post
      const post = await Post.create({
        title,
        content,
        userId,
        tags: tags || [],
      });

      return res.status(200).json({
        message: "Post successfully created",
        data: post,
      });
      //   next();
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "failed to create post" });
    }
  }

  /**
   * @desc    Get all posts
   * @route   GET /api/posts
   * @access  Public
   */
  async getAllPosts(req: Request, res: Response): Promise<any> {
    try {
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate({
          path: "userId",
          select: "username profilePicture",
          options: { lean: true },
        })
        .lean();
      return res.status(200).json({
        message: "Posts retrieved successfully",
        data: posts.map((post) => ({
          ...post,
          user: post.userId,
        })),
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "failed to fetch posts" });
    }
  }

  /**
   * Get a single post by ID
   */
  async getPostById(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id;
      const post = await Post.findById(id)
        .populate({
          path: "userId",
          select: "username profilePicture",
          options: { lean: true },
        })
        .lean();

      if (!post) {
        return res.status(404).json({
          error: "Post not found",
        });
      }
      return res.status(200).json({
        message: "Successfully retrieved a post",
        data: {
          title: post.title,
          content: post.image || [], // Ensure content exists
          tags: post.tags || [],
          author: post.userId,
          createdAt: post.createdAt,
        },
      });
    } catch (error) {
      console.error("Error getting post:", error);
      res.status(500).json({ error: "Failed to get a post" });
    }
  }

  /**
   * Update a post (only by the owner)
   */
  async updatePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { text, image, tags } = req.body;
    const userId = req.user?.userId;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is required" });
    }
    try {
      const post = await Post.findOneAndUpdate(
        { _id: req.params.id, userId: userId },
        { text, image, tags },
        { new: true } // return the updated post
      );
      if (!post) {
        return res
          .status(400)
          .json({ error: "Post not found or not authorized" });
      }
      return res.status(200).json({
        message: "Post updated successfully",
        Data: post,
      });
    } catch (error) {
      res.status(500).json({ error: "failed to update" });
    }
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    try {
      const post = await Post.findOneAndDelete({
        _id: req.params.id,
        userId: userId,
      });

      if (!post) {
        res.status(400).json({ error: "Post not found or not authorized" });
        return;
      }
      res.status(200).json({ message: "successfully deleted" });
      return;
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post " });
      return;
    }
  }

  /**
   * @desc    Like a post
   * @route   POST /api/posts/:id/like
   * @access  Private
   */
  async likePost(req: Request, res: Response): Promise<any> {
    const userId = req.user?.userId;
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if post already liked
      const alreadyLiked = post.likes.some(
        (likeId) => likeId.toString() === userId.toString()
      );
      if (alreadyLiked) {
        return res.status(400).json({ error: "Post already liked" });
      }

      // Then add like
      post.likes.push(userId);
      await post.save();
      return res.status(200).json({ message: "Post liked successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Failed to like post" });
    }
  }

  async unlikePost(req: Request, res: Response): Promise<any> {
    const userId = req.user?.userId;
    const id = req.params.id;
    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ error: "Post ot found" });
      }

      // check if post already unlike
      const hasLiked = post.likes.some(
        (likeId) => likeId.toString() === userId.toString()
      );
      if (!hasLiked) {
        return res.status(400).json({ error: "Post not liked yet" });
      }
      // if (post.likes.includes(userId.toString())) {
      // }
      //    //remove the like
      post.likes = post.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
      await post.save();
      res.status(200).json({ message: "Post unliked successfully" });
    } catch (error) {
      console.error("Error unliking post:", error);
      return res.status(500).json({ error: "Failed to unlike" });
    }
  }
}

export default new postController();
