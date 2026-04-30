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

/** הודעת שגיאה אנושית ללקוח (API routes) */
export function cloudinaryErrorToMessage(err) {
  if (!err) return 'שגיאה בהעלאה ל-Cloudinary'
  const nested = err.error && typeof err.error === 'object' ? err.error.message : null
  const msg = nested || err.message || String(err)
  const http = Number(err.http_code)
  if (http === 401) {
    return 'Cloudinary דחה את הבקשה (בדוק Cloud name, API Key ו-API Secret ב-.env — בלי רווחים לפני/אחרי)'
  }
  if (http === 403) {
    return 'אין הרשאה להעלאה ב-Cloudinary (בדוק הרשאות בחשבון)'
  }
  if (http >= 500) {
    return `שגיאת שרת Cloudinary (${http}). נסה פורמט אחר או קובץ קטן יותר. פירוט: ${msg}`
  }
  return msg
}

/**
 * image | video | raw — אודיו כ-raw (יציב; auto/video גרמו לכשלים / 500 בחלק מהפורמטים).
 */
export function resourceTypeFromMimetype(mimetype) {
  if (!mimetype || typeof mimetype !== 'string') return 'raw'
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  if (mimetype.startsWith('audio/')) return 'raw'
  return 'raw'
}

/**
 * @param {string} localPath
 * @param {{ folder: string, mimetype?: string }} opts
 * @returns {Promise<{ secure_url: string, public_id: string, bytes: number }>}
 */
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
    // cloudinary v2: (file, options, callback) — לא (file, callback, options)
    if (useLarge) {
      cloudinary.uploader.upload_large(localPath, baseOptions, cb)
    } else {
      cloudinary.uploader.upload(localPath, baseOptions, cb)
    }
  })

  const secureUrl = result.secure_url || result.url
  if (!secureUrl || typeof secureUrl !== 'string') {
    console.error('Cloudinary response without URL:', result)
    throw new Error('תשובת Cloudinary ללא כתובת קובץ (secure_url)')
  }

  return {
    secure_url: secureUrl,
    public_id: result.public_id,
    bytes: result.bytes ?? stats.size,
  }
}

/**
 * מחיקה לפי URL מלא של Cloudinary (אחרת מחזיר false)
 */
export async function deleteCloudinaryByUrl(url) {
  const parsed = parseCloudinaryUrl(url)
  if (!parsed) return false
  try {
    configure()
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        parsed.publicId,
        { resource_type: parsed.resourceType },
        (err, res) => {
          if (err) reject(err)
          else resolve(res)
        }
      )
    })
    return true
  } catch (e) {
    console.warn('Cloudinary destroy failed:', e?.message || e)
    return false
  }
}

export function parseCloudinaryUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null
  try {
    const u = new URL(url)
    const segs = u.pathname.split('/').filter(Boolean)
    const uploadIdx = segs.indexOf('upload')
    if (uploadIdx < 2) return null
    const resourceType = segs[uploadIdx - 1]
    if (!['image', 'video', 'raw'].includes(resourceType)) return null
    let i = uploadIdx + 1
    if (segs[i]?.match(/^v\d+$/)) i += 1
    const rest = segs.slice(i).join('/')
    if (!rest) return null
    const publicId = rest.replace(/\.[^/.]+$/, '')
    return {
      publicId,
      resourceType: resourceType === 'raw' ? 'raw' : resourceType,
    }
  } catch {
    return null
  }
}

function ensureConfiguredAndReadEnv() {
  configure()
  return readCloudinaryEnv()
}

export function getCloudinaryPublicUploadConfig() {
  const { cloud_name, api_key } = ensureConfiguredAndReadEnv()
  return { cloudName: cloud_name, apiKey: api_key }
}

export function buildCloudinaryFolder(folder) {
  return folder.startsWith(FOLDER_PREFIX) ? folder : `${FOLDER_PREFIX}/${folder}`
}

export function createDirectUploadSignature({ folder, mimetype }) {
  configure()
  const resourceType = resourceTypeFromMimetype(mimetype)
  const targetFolder = buildCloudinaryFolder(folder)
  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = {
    folder: targetFolder,
    resource_type: resourceType,
    timestamp,
    unique_filename: true,
    use_filename: false,
  }
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    readCloudinaryEnv().api_secret
  )
  return {
    signature,
    timestamp,
    folder: targetFolder,
    resourceType,
    uniqueFilename: true,
    useFilename: false,
  }
}
