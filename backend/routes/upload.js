import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Check if running in Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL

// Ensure upload directories exist (only in non-serverless environments)
// In Vercel/serverless, file uploads should use external storage (S3, Cloudinary, etc.)
if (!isVercel) {
  const uploadsDir = path.join(__dirname, '../uploads')
  const videosDir = path.join(uploadsDir, 'videos')

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true })
    }
  } catch (error) {
    console.warn('Failed to create upload directories:', error.message)
  }
}

// Configure multer for file uploads
// In Vercel/serverless, use memory storage instead of disk storage
const storage = isVercel
  ? multer.memoryStorage() // Use memory storage in serverless
  : multer.diskStorage({
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

    // In Vercel/serverless, file uploads to filesystem are not supported
    // Files should be uploaded to external storage (S3, Cloudinary, etc.)
    if (isVercel) {
      return res.status(501).json({ 
        message: 'File uploads are not supported in serverless environment',
        error: 'Please use external storage service (S3, Cloudinary, etc.) for file uploads'
      })
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

export default router

