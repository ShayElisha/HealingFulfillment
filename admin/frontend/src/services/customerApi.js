import api from './api'
import axios from 'axios'

const CLOUDINARY_CHUNK_SIZE = 20 * 1024 * 1024
const LARGE_RAW_BACKEND_RELAY_THRESHOLD = 100 * 1024 * 1024

function isLikelyRawFile(file) {
  const t = String(file?.type || '').toLowerCase()
  if (!t) return true
  if (t === 'application/octet-stream') return true
  return !(t.startsWith('image/') || t.startsWith('video/') || t.startsWith('audio/'))
}

function cloudinaryProgressHandler(onUploadProgress, uploadedBytesBeforeChunk, totalSize) {
  if (typeof onUploadProgress !== 'function') return undefined
  return (e) => {
    const chunkLoaded = e?.loaded || 0
    const loaded = Math.min(totalSize, uploadedBytesBeforeChunk + chunkLoaded)
    const pct = totalSize > 0 ? Math.round((loaded * 100) / totalSize) : null
    onUploadProgress(pct, loaded, totalSize)
  }
}

export const customerService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/customers', { params })
    return response.data
  },
  create: async (payload) => {
    const response = await api.post('/admin/customers', payload)
    return response.data
  },
  openCase: async (id, body = {}) => {
    const response = await api.post(`/admin/customers/${id}/open-case`, body)
    return response.data
  },
  setPurchaseCoachingWindow: async (customerId, purchaseId, body = {}) => {
    const response = await api.post(
      `/admin/customers/${customerId}/purchases/${purchaseId}/coaching-window`,
      body
    )
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/admin/customers/${id}`)
    return response.data
  },
  /** קובץ ללקוח — נשמר ב-Cloudinary */
  uploadFile: async (id, formData, options = {}) => {
    const { onUploadProgress } = options
    const response = await api.post(`/admin/customers/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15 * 60 * 1000,
      onUploadProgress:
        typeof onUploadProgress === 'function'
          ? (e) => {
              const total = e.total || 0
              const pct = total ? Math.round((e.loaded * 100) / total) : null
              onUploadProgress(pct, e.loaded, total)
            }
          : undefined,
    })
    return response.data
  },
  /** אודיו ללקוח — נשמר ב-Cloudinary */
  uploadAudio: async (id, formData, options = {}) => {
    const { onUploadProgress } = options
    const response = await api.post(`/admin/customers/${id}/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15 * 60 * 1000,
      onUploadProgress:
        typeof onUploadProgress === 'function'
          ? (e) => {
              const total = e.total || 0
              const pct = total ? Math.round((e.loaded * 100) / total) : null
              onUploadProgress(pct, e.loaded, total)
            }
          : undefined,
    })
    return response.data
  },
  getDirectUploadSignature: async (id, payload) => {
    const response = await api.post(`/admin/customers/${id}/files/direct-signature`, payload)
    return response.data
  },
  saveDirectUpload: async (id, payload) => {
    const response = await api.post(`/admin/customers/${id}/files/direct-complete`, payload)
    return response.data
  },
  uploadDirectToCloudinary: async (signatureData, file, onUploadProgress) => {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      signatureData.cloudName
    )}/${encodeURIComponent(signatureData.resourceType)}/upload`
    const sharedFields = {
      api_key: signatureData.apiKey,
      timestamp: String(signatureData.timestamp),
      signature: signatureData.signature,
      folder: signatureData.folder,
      use_filename: String(Boolean(signatureData.useFilename)),
      unique_filename: String(Boolean(signatureData.uniqueFilename)),
    }

    const totalSize = Number(file?.size || 0)
    const shouldChunk = totalSize > CLOUDINARY_CHUNK_SIZE

    if (!shouldChunk) {
      const fd = new FormData()
      fd.append('file', file)
      Object.entries(sharedFields).forEach(([k, v]) => fd.append(k, v))
      const response = await axios.post(uploadUrl, fd, {
        timeout: 20 * 60 * 1000,
        onUploadProgress: cloudinaryProgressHandler(onUploadProgress, 0, totalSize),
      })
      return response.data
    }

    const uploadId =
      (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    let lastResponseData = null

    for (let start = 0; start < totalSize; start += CLOUDINARY_CHUNK_SIZE) {
      const endExclusive = Math.min(totalSize, start + CLOUDINARY_CHUNK_SIZE)
      const chunk = file.slice(start, endExclusive)
      const fd = new FormData()
      fd.append('file', chunk)
      Object.entries(sharedFields).forEach(([k, v]) => fd.append(k, v))
      const response = await axios.post(uploadUrl, fd, {
        timeout: 20 * 60 * 1000,
        headers: {
          'Content-Range': `bytes ${start}-${endExclusive - 1}/${totalSize}`,
          'X-Unique-Upload-Id': uploadId,
        },
        onUploadProgress: cloudinaryProgressHandler(onUploadProgress, start, totalSize),
      })
      lastResponseData = response.data
    }

    if (!lastResponseData?.secure_url && !lastResponseData?.url) {
      throw new Error('Cloudinary chunk upload completed without file URL')
    }
    return lastResponseData
  },
  shouldUseBackendRelayForLargeRaw: (file) => {
    const size = Number(file?.size || 0)
    return size >= LARGE_RAW_BACKEND_RELAY_THRESHOLD && isLikelyRawFile(file)
  },
  deleteFile: async (customerId, fileId) => {
    const response = await api.delete(`/admin/customers/${customerId}/files/${fileId}`)
    return response.data
  },
  addNote: async (id, content) => {
    const response = await api.post(`/admin/customers/${id}/notes`, { content })
    return response.data
  },
  updateSessions: async (id, completedSessions) => {
    const response = await api.put(`/admin/customers/${id}/sessions`, { completedSessions })
    return response.data
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/customers/${id}/status`, { status })
    return response.data
  },
  createAccount: async (id) => {
    const response = await api.post(`/admin/customers/${id}/create-account`)
    return response.data
  },
  resetPassword: async (id) => {
    const response = await api.post(`/admin/customers/${id}/reset-password`)
    return response.data
  },
  getTriggerJournal: async (id, params = {}) => {
    const response = await api.get(`/admin/customers/${id}/trigger-journal`, { params })
    return response.data
  },
}

