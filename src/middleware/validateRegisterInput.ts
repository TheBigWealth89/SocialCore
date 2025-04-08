import { Request, Response, NextFunction } from "express";
import BlacklistedToken from "../models/blacklistTokenschem";

// import { addBlacklist } from "../utils/tokenUtils";

export const registerInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { username, email, password } = req.body;

  // Check for empty username first
  if (!username || username.trim() === "") {
    res.status(400).json({
      error: "Please enter a username.",
    });
    return;
  }

  // Then check for special characters
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    res.status(400).json({
      error: "No special characters allowed in username.",
    });
    return;
  }

  // Finally check length
  if (typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({
      error: "Username must be at least 3 characters long.",
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format." });
    return;
  }

  if (
    !password ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 16
  ) {
    res
      .status(400)
      .json({ error: "Password must be between 8 and 16 characters." });
    return;
  }

  next(); // Proceed to the next middleware or controller
};

export const loginInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format." });
    return;
  }
  if (!password) {
    res.status(400).json({
      error: "Password is required",
    });
    return;
  }
  next();
};

export const verifyAuthForLogout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token =
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.cookies.access_token;
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  try {
    const isBlacklisted = await BlacklistedToken.exists({ token });
    if (isBlacklisted) {
      res.status(401).json({ error: "Token revoke" });
    }
    next();
  } catch (error) {
    console.error(error);
  }

  //Then we have to check if token is blacklisted

  //Checks redis for blacklisted token
  // async () => {
  //   try {
  //     const isTokenBlacklisted = await redisClient.get(`Blacklist: ${token}`);
  //     if (isTokenBlacklisted) {
  //       res.status(401).json({ error: "Token revoked" });
  //       return;
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };
};

/* 
 import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
export const registerInput = [
  //Email validation
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be altest 8 characters")
    .matches(/\d/)
    .withMessage("password must contain a number"),
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isAlphanumeric()
    .withMessage("No special characters allowed"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    next();
  },
];

 */
