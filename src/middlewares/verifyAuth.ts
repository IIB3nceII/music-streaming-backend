import { IRequest, IUser } from "../models";
import { expressjwt } from "express-jwt";
import { NextFunction, Response } from "express";
import getDb from "../db";
import { ObjectId } from "mongodb";
import { jwtSecret } from "../constants";

const injectUser = async (req: IRequest, res: Response, next: NextFunction) => {
  const db = getDb();
  const users = db.collection<IUser>("user");

  if (req.auth.id && req.user) {
    req.auth.id = new ObjectId(req.auth.id);
    req.user = (await users.findOne({
      _id: req.auth.id,
    })) as IUser;
    console.log("req.user", req.user, req.auth.id);
  }

  next();
};

export default () => [
  expressjwt({ secret: jwtSecret!, algorithms: ["HS256"] }),
  injectUser,
];
