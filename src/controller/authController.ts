import { Request, Response } from "express";
import User from "../models/user";
import { hash, compare } from "bcrypt";
import { generateTokens } from "../utils/tokenUtils";
import { LoginError } from "../error/customErrors";
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exist!" });
      return;
    }
    const saltRound = 10;
    const hashedPassword = await hash(password, saltRound);
    console.log(`Hashed password ${hashedPassword}`);

    const user = new User({ email, username, password });
    await user.save();
    const tokens = generateTokens({ userId: user.id });
    res.status(201).json({
      user: { id: user._id, email: user.email, username: user.username },
      tokens,
    });
  } catch (error) {
    console.error("Register error", error);
  }
};

//login
export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new LoginError("Email and Password are required", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new LoginError("Invalid credentials", 401);
    }
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      throw new LoginError("Invalid credentials", 403);
    }

    if (user.isLocked) {
      throw new LoginError("Account temporarily locked", 401);
    }

    const token = generateTokens({ userId: user._id, role: "user" });
    res.status(201).json({ id: user._id, email: user.email, role: "user" });
  } catch (error) {
    // Handle specific error types
    if (error instanceof LoginError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.statusCode,
      });
    }

    // Generic server error (don't expose details in production)
    console.error("Login error:", error);
    res.status(500).json({
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Authentication failed",
    });
  }
};
