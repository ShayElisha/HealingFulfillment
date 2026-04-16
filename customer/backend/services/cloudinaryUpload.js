import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'

const FOLDER_PREFIX = (process.env.CLOUDINARY_FOLDER || 'healingfulfillment').trim()

let configured = false

function trimEnv(v) {
  if (v == null || typeof v !== 'string') return ''
  return v.trim().replace(/^["']|["']$/g, '')
}

function readCloudinaryEnv() {
  return {
    cloud_name: trimEnv(process.env.CLOUDINARY_CLOUD_NAME),
    api_key: trimEnv(process.env.CLOUDINARY_API_KEY),
    api_secret: trimEnv(process.env.CLOUDINARY_API_SECRET),
  }
}

function configure() {
  if (configured) return
  const { cloud_name, api_key, api_secret } = readCloudinaryEnv()
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'חסר הגדרת Cloudinary: הגדר CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    )
  }
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  })
  configured = true
}

export function isCloudinaryConfigured() {
  const { cloud_name, api_key, api_secret } = readCloudinaryEnv()
  return Boolean(cloud_name && api_key && api_secret)
}

export function cloudinaryErrorToMessage(err) {
  if (!err) return 'שגיאה בהעלאה ל-Cloudinary'
  const nested = err.error && typeof err.error === 'object' ? err.error.message : null
  const msg = nested || err.message || String(err)
  const http = Number(err.http_code)
  if (http === 401) {
    return 'Cloudinary דחה את הבקשה (בדוק Cloud name, API Key ו-API Secret)'
  }
  if (http === 403) {
    return 'אין הרשאה להעלאה ב-Cloudinary (בדוק הרשאות בחשבון)'
  }
  if (http >= 500) {
    return `שגיאת שרת Cloudinary (${http}). פירוט: ${msg}`
  }
  return msg
}

function resourceTypeFromMimetype(mimetype) {
  if (!mimetype || typeof mimetype !== 'string') return 'raw'
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  return 'raw'
}

export async function uploadLocalFileToCloudinary(localPath, opts) {
  configure()
  const resourceType = resourceTypeFromMimetype(opts.mimetype)
  const folder = opts.folder.startsWith(FOLDER_PREFIX) ? opts.folder : `${FOLDER_PREFIX}/${opts.folder}`

  let stats
  try {
    stats = fs.statSync(localPath)
  } catch {
    throw new Error('קובץ זמני לא נמצא')
  }

  const baseOptions = {
    folder,
    resource_type: resourceType,
    use_filename: false,
    unique_filename: true,
  }

  const useLarge =
    resourceType === 'video' && stats.size != null && stats.size > 15 * 1024 * 1024

  const result = await new Promise((resolve, reject) => {
    const cb = (err, res) => {
      if (err) reject(err)
      else resolve(res)
    }
    if (useLarge) {
      cloudinary.uploader.upload_large(localPath, baseOptions, cb)
    } else {
      cloudinary.uploader.upload(localPath, baseOptions, cb)
    }
  })

  const secureUrl = result.secure_url || result.url
  if (!secureUrl || typeof secureUrl !== 'string') {
    throw new Error('תשובת Cloudinary ללא כתובת קובץ')
  }

  return {
    secure_url: secureUrl,
    public_id: result.public_id,
    bytes: result.bytes ?? stats.size,
  }
}
