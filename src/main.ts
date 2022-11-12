import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { httpLocalPort } from "./constants";
import { connectToServer } from "./db";
import { authRouter } from "./routes";

const app = express();
const port = httpLocalPort || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRouter);

app.use((err: Error, req: Request, res: Response) => {
  res.status(500).json({ message: err.message });
});

connectToServer().then(async () => {
  app.listen(port, () => {
    return console.log(`🚀 Listening at http://localhost:${port}`);
  });
});
