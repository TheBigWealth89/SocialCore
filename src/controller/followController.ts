import { Request, Response } from "express";
import Follow from "../models/follow";
import mongoose from "mongoose";
class FollowController {
  /**
   * @desc    follow a user
   * @route   POST /api/follow/targetedUserId
   * @access  Private
   */
  async follow(req: Request, res: Response): Promise<any> {
    try {
      const { targetUserId } = req.params;
      const followerId = req.user?.userId;

      if (!followerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // prevent user from following itself
      if (followerId.toString() === targetUserId.toString()) {
        return res.status(400).json({ error: "You cannot follow yourself" });
      }

      // check if user is already followed
      const existingFollow = await Follow.findOne({
        follower: followerId,
        following: targetUserId,
      });

      if (existingFollow) {
        return res.status(400).json({ error: "Already following this user" });
      }

      const follow = new Follow({
        follower: followerId,
        following: targetUserId,
      });
      await follow.save();

      const populatedFollow = await Follow.findOne({
        _id: follow._id,
      }).populate({
        path: "following",
        select: "username email",
      });

      if (!populatedFollow) {
        return res
          .status(500)
          .json({ error: "Failed to populate follow data" });
      }

      res.status(200).json({
        message: "Successfully followed",
        data: {
          user: populatedFollow.following,
          followDate: populatedFollow.createdAt,
        },
      });
    } catch (error) {
      console.error("Follow error:", error);
      return res.status(500).json({ error: "Failed to follow" });
    }
  }

  /**
   * @desc    Get user's followers
   * @route   POST /api/follow/followers/userId
   * @access  public
   */
  async getFollowers(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;

      const followers = await Follow.find({ following: userId })
        .populate({
          path: "follower",
          select: "username email",
          options: { lean: true },
        })
        .lean();

      res.status(200).json({
        followers: followers.map((f) => ({
          user: f.follower,
          followDate: f.createdAt,
        })),
      });
    } catch (error) {
      console.error("Follow error:", error);
      res.status(500).json({
        error: "Failed to load followers",
      });
    }
  }
  /**
   * @desc    Get user's followings
   * @route   GET /api/follow/following/userId
   * @access  public
   */
  async getFollowings(req: Request, res: Response) {
    const { userId } = req.params;
    try {
      const followings = await Follow.find({ follower: userId })
        .populate({
          path: "following",
          select: "username email",
          options: { lean: true },
        })
        .lean();
      res.status(200).json({
        followings: followings.map((f) => ({
          user: f.following,
          followingDate: f.createdAt,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load followings" });
    }
  }

  /**
   * @desc    Check if the current user is following a target user
   * @route   GET /api/follow/targetUserId
   * @access  Private
   */
  async getFollowStatus(req: Request, res: Response): Promise<any> {
    try {
      const { targetUserId } = req.params;
      const followedId = req.user?.userId;
      console.log(targetUserId);
      const follow = await Follow.findOne({
        follower: followedId,
        following: targetUserId,
      });
      res.status(200).json({
        isFollowing: !!follow,
        status: follow?.status || "not_following",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get status" });
    }
  }
  /**
   * @desc    Unfollow a user
   * @route   DELETE /api/follow/targetUserId
   * @access  Private
   */
  async unfollow(req: Request, res: Response): Promise<any> {
    try {
      const { targetUserId } = req.params;
      const followerId = req.user?.userId;
      console.log(targetUserId);
      const result = await Follow.deleteOne({
        follower: followerId, // Corrected field name
        following: targetUserId,
      });
      console.log(result);
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Follow relationship not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to unfollow" });
    }
  }
}

export default new FollowController();
