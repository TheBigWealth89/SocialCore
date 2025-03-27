import { Request, Response } from "express";
import User from "../models/user";
import { generateTokens } from "../utils/tokenUtils";
import { hash } from "bcrypt";
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    //check if email alredy exist
    if (await User.findOne({ email })) {
      res.status(400).json({
        message: "email already exist!",
      });

      //Hash password before saving
      const saltRound = 10;
      const hasshedPassword = await hash(password, saltRound);
      //creat user
      const user = new User({ email, password: hasshedPassword, username });

      user.save();
      const tokens = generateTokens({ userId: user._id });
      res.status(200).json({ user, tokens });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.json({ error: error.message });
    } else {
      res.json({ error: "An unknown error occurred" });
    }
  }
};

//Login handler
export const loginUser = async (req: Request, res: Response) => {};
