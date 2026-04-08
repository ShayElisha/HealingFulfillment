import express from 'express'
import mongoose from 'mongoose'
import ForWhomProfile from '../models/ForWhomProfile.js'

const router = express.Router()

function sortProfiles(list) {
  return [...list].sort((a, b) => {
    const ao = Number(a.order) || 0
    const bo = Number(b.order) || 0
    if (ao !== bo) return ao - bo
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return db - da
  })
}

// GET /api/for-whom-audience/page/:id — דף ציבורי לפי מזהה המסמך (ללא slug במסד)
router.get('/for-whom-audience/page/:id', async (req, res, next) => {
  try {
    const raw = req.params.id
    if (!mongoose.Types.ObjectId.isValid(raw)) {
      return res.status(400).json({ message: 'מזהה לא תקין' })
    }
    const doc = await ForWhomProfile.findOne({
      _id: raw,
      isActive: true,
    }).lean()
    if (!doc) {
      return res.status(404).json({ message: 'לא נמצא' })
    }
    res.json({
      message: 'נשלף בהצלחה',
      data: doc,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/for-whom-audience — ציבורי, רק פעילים
router.get('/for-whom-audience', async (req, res, next) => {
  try {
    const rows = sortProfiles(await ForWhomProfile.find({ isActive: true }).lean())
    res.json({
      message: 'נשלף בהצלחה',
      data: rows,
    })
  } catch (error) {
    next(error)
  }
})

export default router
