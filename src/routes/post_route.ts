import { Router } from "express";
import post from "../models/post";
const postRouter = Router();
//create a new post
postRouter.post("/");

//get a specfic post
postRouter.get("/:id");

//update by id
postRouter.put("/:id");

//delete post by id
postRouter.delete("/:id");

export default postRouter;
