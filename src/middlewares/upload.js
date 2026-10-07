import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink, rename } from 'node:fs/promises';
import { fileTypeFromFile } from 'file-type';

export const ALLOWED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};
export const MAX_SIZE = 5 * 1024 * 1024;

export function createUpload(uploadDir) {
  // Keep unverified content outside the downloadable directory.
  const stagingDir = path.join(uploadDir, '.staging');
  mkdirSync(stagingDir, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: stagingDir,
      filename: (_req, file, cb) => {
        cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: MAX_SIZE, files: 5, fields: 10, parts: 15 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED[file.mimetype]?.includes(ext)) {
        return cb(Object.assign(new Error('รองรับเฉพาะ JPEG, PNG, WebP และ PDF'), { status: 415 }));
      }
      cb(null, true);
    },
  });

  async function verifyFileType(req, _res, next) {
    const files = req.file ? [req.file] : req.files || [];
    try {
      for (const file of files) {
        let detected;
        try {
          detected = await fileTypeFromFile(file.path);
        } catch (error) {
          if (error.name !== 'EndOfStreamError') throw error;
        }
        const ext = path.extname(file.filename);
        if (!detected || detected.mime !== file.mimetype || !ALLOWED[detected.mime]?.includes(ext)) {
          throw Object.assign(new Error('เนื้อหาไฟล์ไม่ตรงกับชนิดและนามสกุลที่ระบุ'), { status: 415 });
        }
      }
      for (const file of files) {
        const destination = path.join(uploadDir, file.filename);
        await rename(file.path, destination);
        file.path = destination;
      }
      next();
    } catch (error) {
      await Promise.all(files.map(async (file) => {
        try { await unlink(file.path); }
        catch (cleanupError) { if (cleanupError.code !== 'ENOENT') console.error(cleanupError); }
      }));
      next(error);
    }
  }

  return { upload, verifyFileType };
}
