import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const uploadsDir = path.join(__dirname, '../uploads')
const videosDir = path.join(uploadsDir, 'videos')
const forWhomAudioDir = path.join(uploadsDir, 'for-whom', 'audio')
const forWhomImageDir = path.join(uploadsDir, 'for-whom', 'images')

try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true })
  if (!fs.existsSync(forWhomAudioDir)) fs.mkdirSync(forWhomAudioDir, { recursive: true })
  if (!fs.existsSync(forWhomImageDir)) fs.mkdirSync(forWhomImageDir, { recursive: true })
} catch (error) {
  console.warn('Failed to create upload directories:', error.message)
}

// Configure multer for file uploads
const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        // Only videos allowed
        if (file.mimetype.startsWith('video/')) {
          cb(null, path.join(__dirname, '../uploads/videos'))
        } else {
          cb(new Error('Only video files are allowed'))
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
      }
    })

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Only accept video files
    if (file.mimetype.startsWith('video/')) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only video files are allowed (MP4, MOV, AVI, etc.).'))
    }
  }
})

// POST /api/upload - Upload a file
router.post('/', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
}

    const fileType = 'video' // Only videos allowed
    const fileUrl = `/uploads/videos/${req.file.filename}`

    res.json({
      message: 'File uploaded successfully',
      data: {
        name: req.file.originalname,
        url: fileUrl,
        type: fileType,
        size: req.file.size
      }
    })
  } catch (error) {
    next(error)
  }
})

const forWhomAudioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, forWhomAudioDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname).toLowerCase() || '.mp3'}`)
  },
})

const forWhomImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, forWhomImageDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `img-${uniqueSuffix}${path.extname(file.originalname).toLowerCase() || '.jpg'}`)
  },
})

const forWhomAudioUpload = multer({
  storage: forWhomAudioStorage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) return cb(null, true)
    cb(new Error('יש להעלות קובץ אודיו בלבד (למשל mp3, wav, ogg).'))
  },
})

const forWhomImageUpload = multer({
  storage: forWhomImageStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype)) return cb(null, true)
    cb(new Error('יש להעלות תמונה: JPEG, PNG, WebP או GIF.'))
  },
})

router.post('/for-whom/audio', forWhomAudioUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'לא הועלה קובץ' })
    }
    const fileUrl = `/uploads/for-whom/audio/${req.file.filename}`
    res.json({
      message: 'הקובץ הועלה בהצלחה',
      data: {
        name: req.file.originalname,
        url: fileUrl,
        type: 'audio',
        size: req.file.size,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/for-whom/image', forWhomImageUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'לא הועלה קובץ' })
    }
    const fileUrl = `/uploads/for-whom/images/${req.file.filename}`
    res.json({
      message: 'התמונה הועלתה בהצלחה',
      data: {
        name: req.file.originalname,
        url: fileUrl,
        type: 'image',
        size: req.file.size,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router

