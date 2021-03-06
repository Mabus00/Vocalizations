// @https://twitter.com/Musawir01342189/status/1345743937605140497?s=20;

import multer from 'multer';
import fs from 'fs';
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/files');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const exists = async (fileName) => {
    // checks if the file exists in the directory
    const __dirname = path.resolve();
    try {
        await fs.promises.access(path.join(__dirname, '/uploads/files', fileName));
        return true;
    } catch {
        return false;
    }
}

const filefilter = (req, file, cb) => {
    // only save the file if it doesn't exist and the format is one of the indicated three; similar process is used in controllers/files.js
    if (exists(file.originalname) && (file.mimetype === 'application/json' || file.mimetype === 'audio/mpeg' 
        || file.mimetype === 'audio/wav')) {
            cb(null, true);
    }else {
        cb(null, false);
    }
}

const upload = multer({storage: storage, fileFilter: filefilter});

export default upload;