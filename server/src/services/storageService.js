import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';

const SERVER_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Swappable storage layer.
// Today the "local" driver writes to server/uploads and the database stores only
// a relative URL such as /uploads/logos/<file>.png. A Cloudinary driver can later
// implement the same saveFile/removeFile pair without changing any controller.
export function uploadRoot() {
  // An absolute UPLOAD_DIR is used as-is (tests use a temp folder);
  // a relative one is resolved from server/, not from the current working directory.
  return path.isAbsolute(config.uploadDir)
    ? config.uploadDir
    : path.resolve(SERVER_ROOT, config.uploadDir);
}

// Converts a stored public path (/uploads/logos/x.png) into a safe absolute path.
export function toAbsolutePath(publicPath) {
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/uploads/')) {
    throw new Error('Invalid stored file path');
  }
  const root = uploadRoot();
  const absolute = path.resolve(root, publicPath.slice('/uploads/'.length));

  // Block path traversal: the resolved file must stay inside the upload folder.
  const relativeToRoot = path.relative(root, absolute);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('Invalid stored file path');
  }
  return absolute;
}

// Saves a Buffer and returns { path, size } for the database record.
export async function saveFile(buffer, { folder = 'files', extension, prefix = 'file' } = {}) {
  const safeFolder = String(folder).replace(/[^a-z0-9_-]/gi, '');
  const safeExtension = String(extension).replace(/[^a-z0-9]/gi, '').toLowerCase();
  const safePrefix = String(prefix).replace(/[^a-z0-9_-]/gi, '');
  if (!safeFolder || !safeExtension) throw new Error('Invalid file location');

  // Unique file name: never trust the name supplied by the browser.
  const filename = `${safePrefix || 'file'}-${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;
  const directory = path.join(uploadRoot(), safeFolder);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), buffer);

  return { path: `/uploads/${safeFolder}/${filename}`, size: buffer.length };
}

// Deletes a stored file. A missing file is not an error (the database is the source of truth).
export async function removeFile(publicPath) {
  try {
    await fs.unlink(toAbsolutePath(publicPath));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
