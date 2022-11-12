import { Request } from "express";
import IUser from "./user.model";

export default interface IRequest extends Request {
  auth?: any;
  user?: IUser;
}
