import { Router } from 'express';
import path from 'node:path';
import { readdir, lstat, unlink } from 'node:fs/promises';
import { createUpload } from '../middlewares/upload.js';

const STORED_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$/;
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const toDto = (file) => ({
  filename: file.filename,
  originalName: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  url: `/api/files/${file.filename}`,
});

export function createFileRouter(uploadDir) {
  const router = Router();
  const { upload, verifyFileType } = createUpload(uploadDir);

  router.post('/', upload.single('file'), verifyFileType, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'กรุณาแนบไฟล์ในฟิลด์ file' });
    res.status(201).json(toDto(req.file));
  });

  router.post('/multiple', upload.array('files', 5), verifyFileType, (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'กรุณาแนบไฟล์ในฟิลด์ files' });
    res.status(201).json({ count: req.files.length, files: req.files.map(toDto) });
  });

  async function listFiles(imagesOnly) {
    const entries = await readdir(uploadDir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !STORED_NAME.test(entry.name)) continue;
      if (imagesOnly && !IMAGE_EXTENSIONS.has(path.extname(entry.name))) continue;
      try {
        const stat = await lstat(path.join(uploadDir, entry.name));
        if (!stat.isFile()) continue;
        files.push({ filename: entry.name, size: stat.size, uploadedAt: stat.mtime.toISOString() });
      } catch (error) {
        // A concurrent DELETE may remove an entry after readdir.
        if (error.code !== 'ENOENT') throw error;
      }
    }
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  router.get('/', async (_req, res) => res.json(await listFiles(false)));
  // This literal route must precede /:filename.
  router.get('/multiple', async (_req, res) => res.json(await listFiles(true)));

  router.param('filename', async (req, res, next, filename) => {
    try {
      if (!STORED_NAME.test(filename)) return res.status(404).json({ error: 'ไม่พบไฟล์' });
      req.filePath = path.join(uploadDir, filename);
      const stat = await lstat(req.filePath);
      if (!stat.isFile()) return res.status(404).json({ error: 'ไม่พบไฟล์' });
      next();
    } catch (error) { next(error); }
  });

  router.get('/:filename', (req, res, next) => {
    res.download(req.filePath, req.params.filename, (error) => {
      if (error) next(error);
    });
  });

  router.delete('/:filename', async (req, res) => {
    await unlink(req.filePath);
    res.status(204).end();
  });
  return router;
}
