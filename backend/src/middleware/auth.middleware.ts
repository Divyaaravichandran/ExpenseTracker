import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { HttpError } from "../utils/HttpError";

interface JwtPayload {
  sub?: string;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new HttpError(401, "Unauthorized"));
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(new HttpError(500, "JWT secret not configured"));
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded.sub) {
      return next(new HttpError(401, "Invalid token"));
    }

    req.user = { id: decoded.sub };
    return next();
  } catch (_error) {
    return next(new HttpError(401, "Invalid or expired token"));
  }
};