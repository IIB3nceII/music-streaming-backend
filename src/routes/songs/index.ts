import express, { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { Filter, ObjectId } from "mongodb";
import getDb, { getBucket } from "src/db";
import upload from "src/db/upload-song";
import { IRequest, ISong, IUser } from "src/models";
import { verifyAuth } from "../../middlewares";
import { getFavoriteCluster, getSuggestions } from "../../engine/predict";

const router = express.Router();

router.use(verifyAuth());

router.get(
  "/",
  expressAsyncHandler(async (req: IRequest, res: Response) => {
    const db = getDb();
    const collection = db.collection<ISong>("song");

    let filter: Filter<ISong> = {};

    if (typeof req.query.user === "string") {
      filter = { userId: new ObjectId(req.query.user) };
    }

    const songs = await collection.find(filter).sort({ date: -1 }).toArray();
    res.status(200).json(songs);
  })
);

router.get(
  "/me",
  expressAsyncHandler(async (req: IRequest, res: Response) => {
    const db = getDb();
    const collection = db.collection<ISong>("song");

    const songs = await collection
      .find({ userId: req.auth.id })
      .sort({ date: -1 })
      .toArray();
    res.status(200).json(songs);
  })
);

router.get(
  "/:id",
  expressAsyncHandler(async (req: IRequest, res: Response) => {
    const db = getDb();
    const collection = db.collection<ISong>("song");

    const song = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (song === null) {
      res.status(404).send("Song not found");
      return;
    }

    res.status(200).json(song);
  })
);

router.get(
  "/:id/stream",
  expressAsyncHandler(async (req, res) => {
    const bucket = getBucket();
    const db = getDb();
    const collection = db.collection<ISong>("song");

    const song = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (song === null) {
      res.status(404).send("Song not found");
      return;
    }

    res.status(200);

    res.set({
      "Content-Type": song.mimeType,
      "Transfer-Encoding": "chunked",
    });

    bucket.openDownloadStreamByName(song.filename).pipe(res);
  })
);

router.get(
  "/recommend",
  expressAsyncHandler(async (req: IRequest, res: Response) => {
    const db = getDb();
    const collection = db.collection<ISong>("song");

    // /songs/recommend?limit=N
    const limit = parseInt(req.params.limit) || 20;

    // Array of song IDs
    const favorites = req.user?.favorites;

    let suggestions: ObjectId[];

    if (!favorites) {
      // Getting any songs
      const songs = await collection
        .find({}, { limit, projection: { _id: 1 } })
        .toArray();
      suggestions = songs.map((song) => song._id);
    } else {
      // Suggesting
      const favoriteCluster = await getFavoriteCluster(favorites);
      suggestions = await getSuggestions(favoriteCluster, favorites);
    }

    res.status(200).json(suggestions);
  })
);

router.post(
  "/",
  upload.single("song"),
  expressAsyncHandler((async (req: IRequest, res: Response): Promise<void> => {
    const db = getDb();
    const collection = db.collection<ISong>("song");
    if (!req.file?.filename) {
      res.status(400).send("File not uploaded");
      return;
    }

    const result = await collection.insertOne({
      userId: req.auth.id,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      title: req.body.title,
      duration: req.body.duration,
      genre: req.body.genre,
      lyrics: req.body.lyrics,
      uploaded: new Date(),
    });

    res.status(200).json(result);
  }) as any)
);

router.put(
  "/:id",
  upload.single("song"),
  expressAsyncHandler(async (req: IRequest, res: Response) => {
    const db = getDb();
    const collection = db.collection<ISong>("song");

    await collection.updateOne(
      { userId: req.auth.id, _id: req.body.id },
      {
        $set: {
          filename: req.file?.filename,
          title: req.body.title,
          duration: req.body.duration,
          genre: req.body.genre,
          lyrics: req.body.lyrics,
        },
      }
    );
    res.status(200).json("Updated successfully");
  })
);

router.delete(
  "/:id",
  expressAsyncHandler(async (req: IRequest, res: Response) => {
    const db = getDb();
    const collection = db.collection<ISong>("song");

    await collection.deleteOne({ userId: req.auth.id, _id: req.body.id });
    res.status(200).json("Deleted successfully");
  })
);

router.post(
  "/:id/favorite",
  expressAsyncHandler(async (req: IRequest, res: Response) => {
    const db = getDb();
    const collection = db.collection<ISong>("song");
    const songId = new ObjectId(req.params.id);

    const song = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    // Check if the song exists
    if (song === null) {
      res.status(404).send("Song not found");
      return;
    }

    const favorites = req.user?.favorites ?? [];

    // Define the operator on the favorites list
    const operator = favorites.find((id: any) => id.equals(songId))
      ? "$pull"
      : "$push";

    await db.collection<IUser>("user").updateOne(
      {
        _id: req.auth.id,
      },
      {
        [operator]: { favorites: songId },
      }
    );

    // Update the user variable in the request
    req.user = (await db
      .collection<IUser>("user")
      .findOne({ _id: req.auth.id })) as IUser;
    res.status(200).json(req.user.favorites);
  })
);

export default router;
