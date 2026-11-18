import multer from 'multer';
import { config } from '../config/env.js';

// Browsers send a MIME type, but a client can lie about it. The controller also
// checks the file's magic bytes before anything is written to disk.
export const MIME_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(_req, file, callback) {
    if (!MIME_EXTENSIONS[file.mimetype]) {
      const error = new Error('Upload a PNG, JPEG, or WebP image');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  }
});

// Expects multipart/form-data with a single file field named "logo".
export const logoUpload = uploader.single('logo');

// Reads the first bytes of the file to confirm the real image format.
export function detectImageExtension(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.subarray(0, 8).equals(pngSignature)) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';

  return null;
}
