// hashed password
// generateToken

import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// hash the password

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// generate Jwt

export const generateToken = (payload: {
  id: string;
  email: string;
}): string => {
  return Jwt.sign(payload,env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
