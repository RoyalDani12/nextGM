import { RegisterDto } from "./auth.types.js";
import { AppError } from "../../middleware/appError.js";
import { findUserByEmail, createUser } from "./auth.repository.js";
import { hashPassword, generateToken } from "../../utils/auth.utils.js";


export const registerService = async (userData: RegisterDto) => {
  // check if the user is already exists
  const existingUser = await findUserByEmail(userData.email);
  if (existingUser) {
    throw new AppError(" Email already in use ", 409);
  }

  // hash password
  const hashedPassword: string = await hashPassword(userData.password);

  // create user via repository
  const user = await createUser({
    ...userData,
    hashedPassword,
  });

  // generate token
  const token = generateToken({ id: user.id, email: user.email });

  return { user, token };
};
