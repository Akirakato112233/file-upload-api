import multer from 'multer';

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'ไฟล์มีขนาดเกิน 5 MB',
      LIMIT_FILE_COUNT: 'อัปโหลดได้สูงสุด 5 ไฟล์ต่อครั้ง',
      LIMIT_UNEXPECTED_FILE: 'ชื่อฟิลด์ไม่ถูกต้อง หรือจำนวนไฟล์เกินกำหนด',
    };
    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .json({ error: messages[error.code] || error.message, code: error.code });
  }
  if (error.code === 'ENOENT') return res.status(404).json({ error: 'ไม่พบไฟล์' });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message });
}
