import { Db, MongoClient } from "mongodb";
import { atlasURI } from "../constants";

const connectionString: string = atlasURI ?? "";
const client = new MongoClient(connectionString);

let db: Db;

export const connectToServer = async () => {
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log("✅ Successfully connected to MongoDB.");
};

const getDb = () => db;

export default getDb;
