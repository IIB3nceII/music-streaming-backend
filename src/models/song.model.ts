import { ObjectId } from "mongodb";

export default interface ISong {
  userId: ObjectId;
  filename: string;
  mimeType: string;
  title: string;
  genre?: string;
  release?: Date;
  duration: number;
  lyrics?: string;
  uploaded: Date;
  cluster?: any;
}
