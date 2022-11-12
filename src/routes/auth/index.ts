import express, { Request, Response } from "express";
import getDb from "../../db";
import { IUser } from "../../models";
import bcrypt from "bcrypt";
import { jwtSecret } from "../../constants";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const db = getDb();

    const users = db.collection<IUser>("user");
    const password = await bcrypt.hash(req.body.password, 10);

    await users.insertOne({
      email: req.body.email,
      password,
      username: req.body.username,
    });

    res.status(200).json({ message: "✅ Registration successful" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const db = getDb();
    const users = db.collection<IUser>("user");

    const user = await users.findOne({
      email: req.body.email,
    });

    if (user) {
      const passwordValid = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (user === null || !passwordValid) {
        return res.status(401).json({
          accessToken: null,
          message: "Email or password is incorrect",
        });
      }

      const accessToken = jwt.sign({ id: user._id }, jwtSecret!);
      res.status(200).json({ accessToken });
    } else {
      res.status(500).json({ message: "User can not be found" });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
