import {Context} from "hono";
import users from "../models/users";
import bcrypt from "bcryptjs";
import {sign} from "hono/jwt";
import {env} from "../config/env.config";

export const signup = async (c: Context) => {
  const {email, password} = await c.req.json();

  if (!email || !password)
    return c.json({message: "Email and password are required"}, 400);

  const existingUser = await users.findOne({email});
  if (existingUser) return c.json({message: "Email already registered"}, 409);

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new users({email, password: hashedPassword});

  await user.save();
  return c.json({message: "User created successfully"}, 201);
};

export const login = async (c: Context) => {
  const {email, password} = await c.req.json();

  if (!email || !password)
    return c.json({message: "Email and password are required"}, 400);

  const user = await users.findOne({email});
  if (!user) return c.json({message: "User not found"}, 404);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return c.json({message: "Invalid credentials"}, 403);

  const expiresInSeconds = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

  const token = await sign(
    {email: user.email, id: user._id, exp: expiresInSeconds},
    env.JWT_SECRET
  );

  return c.json({message: "Login successful", token});
};
