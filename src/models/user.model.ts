import { ObjectId } from "mongodb";

export default interface IUser {
  email: string;
  password: string;
  username: string;
  favorites?: any;
}
