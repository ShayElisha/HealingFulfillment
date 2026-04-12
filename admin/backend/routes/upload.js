/**
 * העלאות ל-Cloudinary בלבד (זמני דיסק → Cloudinary). אין שמירה קבועה לתיקיית uploads.
 */
import express from 'express'
import multer from 'multer'
import path from 'path'
import os from 'os'
import fs from 'fs'
import {
  uploadLocalFileToCloudinary,
  isCloudinaryConfigured,
  cloudinaryErrorToMessage,
} from '../services/cloudinaryUpload.js'
import { catchMulterUpload } from '../middleware/multerCatch.js'

const router = express.Router()

function sendCloudinaryUploadError(res, error, logLabel) {
  console.error(logLabel, error)
  const code = Number(error?.http_code)
  const status = Number.isFinite(code) && code >= 400 && code < 600 ? code : 502
  return res.status(status).json({
    message: cloudinaryErrorToMessage(error),
    ...(process.env.NODE_ENV === 'development' && {
      detail: error.message,
      cloudinary: error.http_code != null ? { http_code: error.http_code, error: error.error } : undefined,
    }),
  })
}

function tmpFilename(_req, file, cb) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  const ext = path.extname(file.originalname || '').toLowerCase()
  cb(null, `hf-${uniqueSuffix}${ext || ''}`)
}

const tmpStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: tmpFilename,
})

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p)
  } catch (e) {
    console.warn('Temp file unlink:', e.message)
  }
}

const videoUpload = multer({
  storage: tmpStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('video/')) return cb(null, true)
    cb(new Error('Invalid file type. Only video files are allowed (MP4, MOV, AVI, etc.).'))
  },
})

const forWhomAudioUpload = multer({
  storage: tmpStorage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('audio/')) return cb(null, true)
    cb(new Error('יש להעלות קובץ אודיו בלבד (למשל mp3, wav, ogg).'))
  },
})

const forWhomImageUpload = multer({
  storage: tmpStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype || '')) return cb(null, true)
    cb(new Error('יש להעלות תמונה: JPEG, PNG, WebP או GIF.'))
  },
})

// POST /api/upload — וידאו ל-Cloudinary (קטגוריות וכו')
router.post('/', catchMulterUpload(videoUpload.single('file')), async (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    safeUnlink(req.file?.path)
    return res.status(503).json({ message: 'העלאת קבצים לא מוגדרת (חסר Cloudinary)' })
  }
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const result = await uploadLocalFileToCloudinary(req.file.path, {
      folder: 'videos',
      mimetype: req.file.mimetype,
    })
    safeUnlink(req.file.path)
    res.json({
      message: 'File uploaded successfully',
      data: {
        name: req.file.originalname,
        url: result.secure_url,
        type: 'video',
        size: result.bytes,
      },
    })
  } catch (error) {
    safeUnlink(req.file?.path)
    return sendCloudinaryUploadError(res, error, 'Upload video:')
  }
})

router.post('/for-whom/audio', catchMulterUpload(forWhomAudioUpload.single('file')), async (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    safeUnlink(req.file?.path)
    return res.status(503).json({ message: 'העלאת קבצים לא מוגדרת (חסר Cloudinary)' })
  }
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: 'לא הועלה קובץ' })
    }
    const result = await uploadLocalFileToCloudinary(req.file.path, {
      folder: 'for-whom/audio',
      mimetype: req.file.mimetype,
    })
    safeUnlink(req.file.path)
    res.json({
      message: 'הקובץ הועלה בהצלחה',
      data: {
        name: req.file.originalname,
        url: result.secure_url,
        type: 'audio',
        size: result.bytes,
      },
    })
  } catch (error) {
    safeUnlink(req.file?.path)
    return sendCloudinaryUploadError(res, error, 'Upload for-whom audio:')
  }
})

router.post('/for-whom/image', catchMulterUpload(forWhomImageUpload.single('file')), async (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    safeUnlink(req.file?.path)
    return res.status(503).json({ message: 'העלאת קבצים לא מוגדרת (חסר Cloudinary)' })
  }
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: 'לא הועלה קובץ' })
    }
    const result = await uploadLocalFileToCloudinary(req.file.path, {
      folder: 'for-whom/images',
      mimetype: req.file.mimetype,
    })
    safeUnlink(req.file.path)
    res.json({
      message: 'התמונה הועלתה בהצלחה',
      data: {
        name: req.file.originalname,
        url: result.secure_url,
        type: 'image',
        size: result.bytes,
      },
    })
  } catch (error) {
    safeUnlink(req.file?.path)
    return sendCloudinaryUploadError(res, error, 'Upload for-whom image:')
  }
})

export default router
