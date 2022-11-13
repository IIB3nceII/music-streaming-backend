import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import { atlasURI } from "src/constants";

const storage = new GridFsStorage({ url: atlasURI! });

const upload = multer({ storage });

export default upload;
